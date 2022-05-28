import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { Metadata } from "src/pages/store";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import { PurchaseRecord } from "../store/checkout/finalize/paypal";
import { PaymentIntentItemResult } from "../store/webhooks/stripe";

export type AggregatedPurchaseRecordPurchases = Omit<PurchaseRecord & { gateway: "stripe" | "paypal" }, "items"> & {
	items: (PaymentIntentItemResult & { id: string; image: string })[];
	type: "single" | "subscription";
};

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

	const purchaseHistory = (
		await db
			.collection("customers")
			.aggregate([
				{
					$match: {
						discordId: req.query.id,
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
				// Stage one:
				// Unwind the "data" field giving us the ability to independently
				// manipulate each element in this array so we can get the id of
				// the purchase
				{
					$unwind: "$data",
				},
				{
					$addFields: {
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
					},
				},

				// Stage two:
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
						discordId: req.query.id,
					},
				},

				// Remove their stripe customer id
				{
					$unset: ["_id"],
				},
			])
			.toArray()
	)[0] as AggregatedPurchaseRecord;

	for (let purchase of purchaseHistory.purchases) {
		for (let item of purchase.items) {
			const product = await stripe.products.retrieve(item.id);
			purchase.type = (product.metadata as Metadata).type!;
			item = Object.assign(item, { image: product.images[0] });
		}
	}

	return res.status(200).json({ history: purchaseHistory });
};

export default withSession(handler);
