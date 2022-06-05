import { stripeConnect } from "src/util/stripe";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../../util/session";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";
import { TIME } from "../../../../../constants";

interface Product extends Stripe.Product {
	prices: Price[];
}

interface Price {
	id: string;
	price: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	let result: Product[] = [];

	const redis = await redisConnect();
	const cached = await redis.get("store:products:one-time");

	if (cached) {
		let parsedCache = JSON.parse(cached) as Product[];
		if (user.developer) {
			return res.status(200).json(parsedCache);
		}
		return res.status(200).json(parsedCache.filter((product) => product.metadata.hidden !== "true"));
	}

	const stripe: Stripe = stripeConnect();
	const { data: products } = await stripe.products.list({
		active: true,
		limit: 100,
	});

	for (const i in products) {
		const { data: price } = await stripe.prices.list({
			active: true,
			product: products[i].id,
			type: "one_time",
		});
		if (price[0]) {
			if (products[i].metadata.type !== "giftable") {
				result.push({
					...products[i],
					prices: [{ id: price[0].id, price: price[0].unit_amount! }],
				});
			}
		}
	}

	await redis.set("store:products:one-time", JSON.stringify(result), "PX", TIME.month);

	if (user.developer) {
		return res.status(200).json(result);
	}
	return res.status(200).json(result.filter((product) => product.metadata.hidden !== "true"));
};

export default withSession(handler);
