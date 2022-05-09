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
	interval: string;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	let result: Product[] = [];

	const redis = await redisConnect();
	const cached = await redis.get("store:products:subscriptions");

	if (cached) {
		return res.status(200).json(JSON.parse(cached));
	}

	const stripe: Stripe = stripeConnect();
	const { data: products } = await stripe.products.list({
		active: true,
	});

	for (const i in products) {
		if (
			user.developer ||
			!JSON.parse(products[i].metadata.hidden || "false")
		) {
			const _prices: Price[] = [];
			const { data: prices } = await stripe.prices.list({
				active: true,
				product: products[i].id,
				type: "recurring",
			});
			if (prices.length >= 1) {
				for (const i in prices) {
					_prices.push({
						id: prices[i].id,
						price: prices[i].unit_amount!,
						interval: prices[i].recurring?.interval!,
					});
				}
				result.push({ ...products[i], prices: _prices });
			}
		}
	}

	await redis.set(
		"store:products:subscriptions",
		JSON.stringify(result),
		"PX",
		TIME.month
	);

	return res.status(200).json(result);
};

export default withSession(handler);
