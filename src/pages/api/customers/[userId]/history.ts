import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { Refund, RefundStatus } from "src/components/dashboard/account/purchases/PurchaseViewer";
import { TIME } from "src/constants";
import { Metadata } from "src/pages/store";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { PurchaseRecord } from "../../store/checkout/finalize/paypal";
import { PaymentIntentItemResult } from "../../store/webhooks/stripe";

// TODO: Optimize this entire path, very slow, 4 second initial load

export interface AggregatedDiscountData {
	id: string;
	appliesTo: string[];
	name: string;
	code: string;
	decimal: number;
	percent: string;
	ignore?: boolean;
}

export type AggregatedPurchaseRecordPurchases = Omit<PurchaseRecord & { gateway: "stripe" | "paypal" }, "items"> & {
	items: (PaymentIntentItemResult & {
		id: string;
		image: string;
		metadata: Metadata;
		priceObject?: PriceObject;
	})[];
	discounts: AggregatedDiscountData[];
	type: Metadata["type"];
	metadata: Metadata;
	refundStatus?: RefundStatus;
};

interface PriceObject {
	value: number;
	interval: Stripe.Price.Recurring.Interval;
	interval_count: number;
}

export interface AggregatedPurchaseRecord {
	discordId: string;
	purchases: AggregatedPurchaseRecordPurchases[];
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();

	const cached = await redis.get(`customer:purchase-history:${req.query.userId}`);
	if (cached) {
		return res.status(200).json({ history: JSON.parse(cached) });
	}

	const purchaseHistory = (
		await db
			.collection("customers")
			.aggregate([
				{
					$match: {
						discordId: req.query.userId,
					},
				},
				{
					$lookup: {
						from: "purchases",
						localField: "purchases.id",
						foreignField: "_id",
						as: "data",
					},
				},
				{
					$lookup: {
						from: "refunds",
						localField: "purchases.id",
						foreignField: "order",
						as: "refunds",
					},
				},
				// Stage one:
				// Unwind the "data" field giving us the ability to independently
				// manipulate each element in this array
				{
					$unwind: "$data",
				},
				{
					$addFields: {
						// Stage two:
						// Add the payment processor type to the purchase data so that
						// it can be guaranteed which was used during checkout
						"data.gateway": {
							// Add a 'gateway' field to each element
							$getField: {
								// Properly get a field from an object
								field: "type", // The field of the object we want
								input: {
									// The object we are getting it from
									$arrayElemAt: [
										// Get an an object from
										"$purchases", // the purchases array
										{
											$indexOfArray: [
												// Select the index which we want to get
												{
													$map: {
														// Create a temporary array of either true or false
														input: "$purchases", // based on the purchases array
														in: {
															$eq: [
																// comparing the ids between
																"$$this.id", // the current purchase object
																"$data._id", // and the current data object
															],
														},
													},
												},
												true,
											],
										},
									],
								},
							},
						},
						// Stage three:
						// Get the discounts used on each product during checkout
						// and add them to an array in the purchase.
						"data.discounts": {
							$reduce: {
								input: {
									$map: {
										input: "$data.items.discounts",
										as: "discount",
										in: {
											$cond: {
												if: {
													$gte: [
														{
															$size: "$$discount",
														},
														1,
													],
												},
												then: {
													id: { $first: "$$discount.id" },
													appliesTo: "$data.items.id",
													name: { $first: "$$discount.name" },
													code: { $first: "$$discount.code" },
													decimal: { $first: "$$discount.discountDecimal" },
													percent: { $first: "$$discount.discountPercentage" },
												},
												else: {
													ignore: true,
												},
											},
										},
									},
								},
								initialValue: [],
								in: {
									$cond: [
										{
											$in: ["$$this.id", "$$value.id"],
										},
										"$$value",
										{ $concatArrays: ["$$value", ["$$this"]] },
									],
								},
							},
						},
					},
				},
				// Stage four:
				// Recoup the data array elements and create a new
				// array, the 'purchases' array
				{
					$group: {
						_id: "$purchases.id",
						purchases: { $push: "$data" },
					},
				},

				// Add the user's discord id
				{
					$addFields: {
						discordId: req.query.userId,
					},
				},

				// Remove their stripe customer id and discounts directly
				// in the items purchased in favour of a combined array
				// within the purchase object
				{
					$unset: ["_id", "purchases.items.discounts"],
				},
			])
			.toArray()
	)[0] as AggregatedPurchaseRecord;

	for (let purchase of purchaseHistory.purchases) {
		const refund = (await db.collection("refunds").findOne({ order: purchase._id })) as Refund;
		if (refund) {
			purchase.refundStatus = refund.status;
		}

		for (let item of purchase.items) {
			const product = await stripe.products.retrieve(item.id);
			purchase.type = (product.metadata as Metadata).type;

			if (product.metadata.type === "giftable") {
				const price = (
					await stripe.prices.search({
						query: `metadata['giftProduct']:'${product.id}'`,
					})
				).data[0];

				item.priceObject = {
					value: item.price,
					interval: price!.recurring!.interval,
					interval_count: price!.recurring!.interval_count,
				} as PriceObject;
			} else if (product.metadata.type === "subscription") {
				const prices = (
					await stripe.prices.list({
						active: true,
						product: product.id,
					})
				).data;

				const price = prices.find((price) => price.unit_amount! / 100 === item.price / item.quantity);
				item.priceObject = {
					value: item.price,
					interval: price!.recurring!.interval,
					interval_count: price!.recurring!.interval_count,
				} as PriceObject;
			}
			item = Object.assign(item, {
				image: product.images[0],
				metadata: {
					...(product.metadata.type === "giftable" && {
						mainInterval: product.metadata.mainInterval,
					}),
				},
			});
		}
	}

	await redis.set(`customer:purchase-history:${req.query.userId}`, JSON.stringify(purchaseHistory), "PX", TIME.month);

	return res.status(200).json({ history: purchaseHistory });
};

export default withSession(handler);
