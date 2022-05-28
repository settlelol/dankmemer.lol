import { APIEmbedField } from "discord-api-types/v10";
import Stripe from "stripe";
import { EventResponse, PaymentIntentItemDiscount, PaymentIntentItemResult } from "../../../stripe";

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	let paymentIntent = event.data.object as Stripe.PaymentIntent;
	if (paymentIntent.description === "Subscription created" || paymentIntent.description === "Subscription update") {
		return {
			result: null,
		};
	}

	paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
	const invoice = await stripe.invoices.retrieve(paymentIntent.invoice!.toString(), { expand: ["discounts"] });
	let discounts: PaymentIntentItemDiscount[] = [];
	for (let i = 0; i < (invoice.discounts as unknown as Stripe.Discount[] | Stripe.DeletedDiscount[])?.length; i++) {
		const discount = invoice.discounts![i] as unknown as Stripe.Discount | Stripe.DeletedDiscount;
		const { data: coupon } = await stripe.promotionCodes.list({
			coupon: discount.coupon?.id,
		});
		discounts.push({
			id: discount.id,
			code: coupon[0].code,
			name: coupon[0].coupon.name || "N/A",
			discountDecimal: discount.coupon.percent_off!,
			discountPercentage: `${parseFloat(discount.coupon.percent_off as unknown as string)}%`,
		});
	}

	const items: PaymentIntentItemResult[] = [];
	for (let lineItem of invoice.lines.data) {
		if (lineItem.description === null) {
			items.push({
				name: "SALESTAX",
				price: lineItem.amount / 100,
				quantity: 1,
				type: lineItem.price?.type!,
			});
		} else {
			const productName = (await stripe.products.retrieve(lineItem.price!.product as string)).name;
			const usedDiscounts =
				lineItem.discount_amounts?.filter((da) => da.amount > 0).map((discount) => discount.discount) || [];
			items.push({
				name: productName,
				price: lineItem.amount / 100,
				quantity: lineItem.quantity!,
				type: lineItem.price?.type!,
				discounts: usedDiscounts.map((usedDiscount) => ({
					...discounts.find((discount) => discount.id === usedDiscount),
				})) as PaymentIntentItemDiscount[],
			});
		}
	}

	let payee: string = "";
	if (invoice.metadata && invoice.metadata.boughtByDiscordId) {
		payee = invoice.metadata!.boughtByDiscordId;
	} else {
		const customer = (await stripe.customers.retrieve(paymentIntent.customer as string)) as Stripe.Customer;
		payee = customer.metadata.discordId;
	}

	const fields: APIEmbedField[] = [
		{
			name: "Purchased by",
			value: `<@!${payee}> (${payee})`,
			inline: paymentIntent.metadata?.isGift && JSON.parse(paymentIntent.metadata.isGift),
		},
	];

	if (paymentIntent.metadata?.isGift && JSON.parse(paymentIntent.metadata.isGift)) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${invoice!.metadata!.giftFor}> (${paymentIntent.metadata.giftFor})`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	fields.push({
		name: "Goods purchased",
		value: `• ${items
			.filter((item) => item.name !== "SALESTAX")
			.map((item) => {
				return `${item.quantity}x ${item.name} ($${item.price.toFixed(2)})`;
			})
			.join("\n• ")}`,
		inline: true,
	});

	if (discounts.length >= 1) {
		fields.push({
			name: "Discounts applied",
			value: `${discounts
				.map((discount) => {
					const discountedItems = items.filter((item: PaymentIntentItemResult) =>
						item.discounts?.find((d) => d.id === discount.id)
					);
					const itemsText = discountedItems.map((item: PaymentIntentItemResult) => {
						return `> ${item?.name} (-$${(item?.price! * (discount.discountDecimal / 100)).toFixed(2)})`;
					});
					return `**${discount.name}** (\`${discount.code}\`) - ${
						discount.discountPercentage
					}\n${itemsText.join("\n")}`;
				})
				.join("\n")}`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Successful Stripe Purchase",
					color: 6777310,
					fields,
					footer: {
						text: `Total purchase value: $${(invoice.amount_paid / 100).toFixed(2)} (incl. sales tax)`,
					},
				},
			],
		},
	};
}
