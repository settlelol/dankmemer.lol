import { stripeConnect } from "src/util/stripe";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../../util/session";
import Stripe from "stripe";

interface Product extends Stripe.Product {
	price: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	let result: Product[] = [];
	const stripe: Stripe = stripeConnect();
	const { data: products } = await stripe.products.list({
		active: true,
	});

	for (const i in products) {
		const { data: price } = await stripe.prices.list({
			product: products[i].id,
			type: "one_time",
		});
		if (price[0])
			result.push({ ...products[i], price: price[0].unit_amount! });
	}

	return res.status(200).json(result);
};

export default withSession(handler);
