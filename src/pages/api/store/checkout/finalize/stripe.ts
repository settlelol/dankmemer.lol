import { ObjectId } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../../util/session";
import {
	PaymentIntentItemDiscount,
	PaymentIntentItemResult,
} from "../../webhooks/stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const invoiceId = req.query.invoice.toString();
	if (!invoiceId) {
		return res.status(400).json({
			error: "No invoice id was provided to finalize this purchase.",
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const { customerName, isGift, giftFor } = req.body;

	const db = await dbConnect();
	const stripe = stripeConnect();
	const _customer = await db
		.collection("customers")
		.findOne({ discordId: user.id });

	if (!_customer) {
		return res.status(500).json({
			error: "Unable to find customer. If you do not receive your purchased goods please contact support and reference the following invoice id",
			invoiceId,
		});
	}

	const invoice = await stripe.invoices.retrieve(invoiceId, {
		expand: ["payment_intent.payment_method", "discounts"],
	});

	const subscription = invoice.billing_reason === "subscription_create";

	let customerData: Stripe.CustomerUpdateParams = {};
	let metadata = {
		boughtByDiscordId: user.id,
		isGift,
		...(isGift && { giftFor }),
	};

	const customer = (await stripe.customers.retrieve(
		_customer._id
	)) as Stripe.Customer;

	if (!customer.name) {
		customerData.name = customerName;
	}

	try {
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
						id: lineItem.price?.product,
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

		await stripe.customers.update(customer.id, customerData);
		await stripe.invoices.update(
			(invoice.payment_intent! as Stripe.PaymentIntent).invoice as string,
			{ metadata }
		);

		if (subscription) {
			const subscriptionInfo = await stripe.subscriptions.retrieve(
				invoice.subscription as string
			);
			await db.collection("customers").updateOne(
				{
					discordId: isGift ? giftFor : user.id,
				},
				{
					$set: {
						subscription: {
							provider: "stripe",
							id: subscriptionInfo.id,
							gifted: isGift,
							...(isGift && { giftedBy: user.id }),
							purchaseTime: subscriptionInfo.current_period_end,
							expiryTime: invoice.period_end,
							automaticRenewal: true,
						},
					},
				},
				{ upsert: true }
			);
		}

		await db.collection("customers").updateOne(
			{ discordId: user.id },
			{
				$push: {
					purchases: {
						type: "stripe",
						id: invoice.id,
					},
				},
			}
		);
		await db.collection("purchases").insertOne({
			_id: invoice.id as unknown as ObjectId,
			isGift,
			giftFor,
			items: items.filter((item) => item.name !== "SALESTAX"),
			purchaseTime: new Date().getTime(),
		});
		req.session.unset("cart");
		req.session.unset("discountCode");

		await req.session.save();
		return res.status(200).json({ invoiceId });
	} catch (e: any) {
		console.error(
			`Error updating Stripe data after purchase completion: ${e.message.replace(
				/"/g,
				""
			)}`
		);
		return res.status(200).json({
			invoiceId,
			error: "An error occurred, however the payment was successful.",
		});
	}
};

export default withSession(handler);
