import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { Refund } from "src/components/dashboard/account/purchases/PurchaseViewer";
import { Metadata } from "src/pages/store";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import { AggregatedPurchaseRecordPurchases, PriceObject } from "./[userId]/history";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const stripe = stripeConnect();

	let purchases: AggregatedPurchaseRecordPurchases[] = [];
	if (req.query.find) {
		purchases = (await db
			.collection("purchases")
			.find({ _id: req.query.find })
			.toArray()) as AggregatedPurchaseRecordPurchases[];
	} else {
		purchases = (await db
			.collection("purchases")
			.find()
			.limit(100)
			.toArray()) as AggregatedPurchaseRecordPurchases[];
	}

	for (let purchase of purchases) {
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

	return res.status(200).json({ history: purchases });
};

export default withSession(handler);
