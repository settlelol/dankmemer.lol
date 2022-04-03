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

export interface PurchaseRecord {
	id: string;
	quantity: number;
	discounts: (Stripe.Discount | Stripe.DeletedDiscount)[];
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const orderID = req.query.orderID.toString();
	if (!orderID) {
		return res.status(400).json({
			error: "No orderID was provided to finalize this purchase.",
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const { stripeInvoice, status, isGift, giftFor } = req.body;

	if (status !== "COMPLETED") {
		return res
			.status(425)
			.json({ error: "Payment has not completed processing." });
	}

	const db = await dbConnect();
	const stripe = await stripeConnect();
	const _customer = await db
		.collection("customers")
		.findOne({ discordId: user.id });

	if (!_customer) {
		return res.status(404).json({
			error: "Unable to find customer. If you do not receive your purchased goods please contact support and reference the following invoice id",
			orderID,
		});
	}

	const invoice = await stripe.invoices.retrieve(stripeInvoice, {
		expand: ["discounts"],
	});
	if (!invoice) {
		return res.status(404).json({
			error: "invoiceId provided did not have any results.",
		});
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
		const items = invoice.lines.data.map(
			(lineItem: Stripe.InvoiceLineItem) => {
				if (lineItem.description !== null) {
					const usedDiscounts =
						lineItem.discount_amounts
							?.filter((discount) => discount.amount > 0)
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
		) as PaymentIntentItemResult[];

		await db.collection("customers").updateOne(
			{ discordId: user.id },
			{
				$push: {
					purchases: {
						type: "paypal",
						id: orderID,
					},
				},
			}
		);
		await db.collection("purchases").insertOne({
			_id: invoice.id as unknown as ObjectId,
			isGift,
			giftFor,
			items: items.filter((item) => item !== undefined),
			purchaseTime: new Date().getTime(),
		});
		await stripe.invoices.voidInvoice(stripeInvoice);
		req.session.unset("cart");
		req.session.unset("discountCode");

		await req.session.save();
		return res.status(200).json({ orderID });
	} catch (e: any) {
		console.error(
			`Error updating purchase records data after paypal purchase completion: ${e.message.replace(
				/"/g,
				""
			)}`
		);
		return res.status(200).json({
			orderID,
			error: "An error occurred, however the payment was successful.",
		});
	}
};

export default withSession(handler);
