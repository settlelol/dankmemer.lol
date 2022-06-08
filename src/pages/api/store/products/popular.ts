import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { stripeConnect } from "src/util/stripe";
import { dbConnect } from "src/util/mongodb";
import { PurchaseRecord } from "../checkout/finalize/paypal";
import { UpsellProduct } from "src/pages/store/cart";
import { Metadata } from "src/pages/store";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();

	const cached = await redis.get("store:popular-purchases");
	if (cached) {
		return res.status(200).json(JSON.parse(cached));
	}

	const lastMonthPurchases = (await db
		.collection("purchases")
		.find({
			purchaseTime: {
				$lte: new Date().getTime(),
				$gte: new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime(),
			},
		})
		.toArray()) as PurchaseRecord[];
	const itemCounts: { [key: string]: number } = {};
	for (let purchase of lastMonthPurchases) {
		for (let item of purchase.items) {
			itemCounts[item.id!] = (itemCounts[item.id!] ?? 0) + item.quantity;
		}
	}

	const sortedPurchases = Object.fromEntries(Object.entries(itemCounts).sort(([_, a], [__, b]) => b - a));
	const top3 = Object.keys(sortedPurchases).slice(0, 3);
	const popularProducts: UpsellProduct[] = [];

	for (let productId of top3) {
		const product = await stripe.products.retrieve(productId);
		const prices = (
			await stripe.prices.list({
				product: product.id,
				active: true,
			})
		).data;

		popularProducts.push({
			id: product.id,
			image: product.images[0],
			name: product.name,
			type: (product.metadata as Metadata).type,
			prices: prices.map((price) => ({
				id: price.id,
				value: price.unit_amount!,
			})),
		});
	}

	await redis.set("store:popular-purchases", JSON.stringify(popularProducts), "PX", TIME.month);
	return res.status(200).json(popularProducts);
};

export default withSession(handler);
