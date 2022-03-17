import axios from "axios";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
// @ts-ignore
import { buffer } from "micro";

export const config = {
	api: {
		bodyParser: false,
	},
};

interface PaymentIntentItemResult {
	name: string;
	price: number;
	quantity: number;
	type: Stripe.Price.Type;
	discounts?: PaymentIntentItemDiscount[] | [];
}

interface PaymentIntentItemDiscount {
	id: string;
	code: string;
	name: string;
	discountDecimal: number;
	discountPercentage: string;
}

interface EmbedField {
	name: string;
	value: string;
	inline?: Boolean;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const stripe = stripeConnect();
	let event: Stripe.Event;
	let result: any = null;

	const requestBuffer = await buffer(req);

	const signature = req.headers["stripe-signature"];
	const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!signingSecret) {
		throw `Missing environment variable 'STRIPE_WEBHOOK_SECRET'`;
	} else if (!signature) {
		return console.error(
			"No Stripe-Signature header was provided during webhook request."
		);
	}

	try {
		event = stripe.webhooks.constructEvent(
			requestBuffer.toString(),
			signature,
			signingSecret
		);
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		result = {
			content: `<@!213912135409991691>`,
			embeds: [
				{
					title: `Failed Stripe signature verification`,
					color: 0xe84141,
					timestamp: new Date(),
					description: e.message.replace(/"/g, ""),
				},
			],
		};
		return res
			.status(500)
			.json({ error: "Failed Stripe signature verification" });
	}

	switch (event.type) {
		case "payment_intent.succeeded":
			let paymentIntent = event.data.object as Stripe.PaymentIntent;
			paymentIntent = await stripe.paymentIntents.retrieve(
				paymentIntent.id
			);
			const invoice = await stripe.invoices.retrieve(
				paymentIntent.invoice!.toString(),
				{ expand: ["discounts"] }
			);
			let discounts: PaymentIntentItemDiscount[] = [];
			for (
				let i = 0;
				i <
				(
					invoice.discounts as unknown as
						| Stripe.Discount[]
						| Stripe.DeletedDiscount[]
				)?.length;
				i++
			) {
				const discount = invoice.discounts![i] as unknown as
					| Stripe.Discount
					| Stripe.DeletedDiscount;
				const { data: coupon } = await stripe.promotionCodes.list({
					coupon: discount.coupon?.id,
				});
				discounts.push({
					id: discount.id,
					code: coupon[0].code,
					name: coupon[0].coupon.name || "N/A",
					discountDecimal: discount.coupon.percent_off!,
					discountPercentage: `${parseFloat(
						discount.coupon.percent_off as unknown as string
					)}%`,
				});
			}

			const items: PaymentIntentItemResult[] = invoice.lines.data.map(
				(lineItem: Stripe.InvoiceLineItem) => {
					if (lineItem.description === null) {
						return {
							name: "SALESTAX",
							price: lineItem.amount / 100,
							quantity: 1,
							type: lineItem.price?.type!,
						};
					} else {
						const usedDiscounts =
							lineItem.discount_amounts
								?.filter((da) => da.amount > 0)
								.map((discount) => discount.discount) || [];
						return {
							name: lineItem.description,
							price: lineItem.amount / 100,
							quantity: lineItem.quantity!,
							type: lineItem.price?.type!,
							discounts: usedDiscounts.map((usedDiscount) => ({
								...discounts.find(
									(discount) => discount.id === usedDiscount
								),
							})) as PaymentIntentItemDiscount[],
						};
					}
				}
			);

			const fields: EmbedField[] = [
				{
					name: "Purchased by",
					value: `<@!${invoice.metadata!.boughtByDiscordId}> (${
						invoice.metadata!.boughtByDiscordId
					})`,
					inline: true,
				},
			];

			if (
				paymentIntent.metadata?.isGift &&
				JSON.parse(paymentIntent.metadata.isGift)
			) {
				fields.push({
					name: "(Gift) Purchased for",
					value: `<@!${paymentIntent.metadata.giftFor}> (${paymentIntent.metadata.giftFor})`,
					inline: true,
				});
			}

			fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
			fields.push({
				name: "Goods purchased",
				value: `• ${items
					.filter((item) => item.name !== "SALESTAX")
					.map((item) => {
						return `${item.quantity}x ${item.name} ($${item.price})`;
					})
					.join("\n• ")}`,
				inline: true,
			});

			if (discounts) {
				fields.push({
					name: "Discounts applied",
					value: `${discounts
						.map((discount) => {
							const discountedItems = items.filter(
								(item: PaymentIntentItemResult) =>
									item.discounts?.find(
										(d) => d.id === discount.id
									)
							);
							const itemsText = discountedItems.map(
								(item: PaymentIntentItemResult) => {
									return `> ${item?.name} (-$${(
										item?.price! *
										(discount.discountDecimal / 100)
									).toFixed(2)})`;
								}
							);
							return `**${discount.name}** (\`${
								discount.code
							}\`) - ${
								discount.discountPercentage
							}\n${itemsText.join("\n")}`;
						})
						.join("\n")}`,
					inline: true,
				});
				fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
			}

			result = {
				avatar_url: "https://stripe.com/img/v3/home/twitter.png",
				embeds: [
					{
						title: "Successful Stripe Purchase",
						color: 6777310,
						fields,
						footer: {
							text: `Total purchase value: $${(
								invoice.amount_paid / 100
							).toFixed(2)} (incl. sales tax)`,
						},
					},
				],
			};
			break;
		case "charge.succeeded":
			const charge = event.data.object;
			console.log(charge);
			break;
	}

	if (result !== null) {
		await axios.post(process.env.STORE_WEBHOOK!, result, {
			headers: { "Content-Type": "application/json" },
		});
	}

	return res.status(200).json({ event });
};

export default withSession(handler);
