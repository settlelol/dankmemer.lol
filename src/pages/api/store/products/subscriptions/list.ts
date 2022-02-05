import { stripeConnect } from "src/util/stripe";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../../util/session";
import Stripe from "stripe";

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
	const stripe: Stripe = stripeConnect();
	const { data: products } = await stripe.products.list({
		active: true,
	});

	for (const i in products) {
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

	return res.status(200).json(result);
};

export default withSession(handler);
