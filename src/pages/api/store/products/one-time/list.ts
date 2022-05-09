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
		if (!JSON.parse(products[i].metadata.hidden || "false")) {
			const { data: price } = await stripe.prices.list({
				active: true,
				product: products[i].id,
				type: "one_time",
			});
			if (price[0]) {
				result.push({
					...products[i],
					prices: [{ id: price[0].id, price: price[0].unit_amount! }],
				});
			}
		}
	}

	return res.status(200).json(result);
};

export default withSession(handler);
