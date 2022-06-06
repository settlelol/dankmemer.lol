import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { stripeConnect } from "src/util/stripe";
import { CartItem } from "src/pages/store";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.query.id) {
		return res.status(400).json({ message: "No product ID was provided." });
	}

	const redis = await redisConnect();
	const stripe = stripeConnect();

	if (req.query.action) {
		switch (req.query.action) {
			case "format":
				const desiredFormat = req.query.to;
				if (!desiredFormat) {
					return res.status(400).json({
						message: "The new (to) format is required to output this object correctly.",
					});
				}

				switch (desiredFormat) {
					case "cart-item":
						const isCached = await redis.get(`formatted-product:${req.query.id}:cart-item`);
						if (isCached) {
							return res.status(200).json(JSON.parse(isCached));
						}
						const product = await stripe.products.retrieve(req.query.id.toString());
						if (!product) {
							return res.status(404).json({ message: "No product with the provided ID was found." });
						}
						const prices = (
							await stripe.prices.list({
								active: true,
								product: product.id,
							})
						).data.map((price) => ({
							id: price.id,
							metadata: price.metadata,
							price: price.unit_amount!,
							type: price.type,
							interval: price.recurring?.interval,
						}));
						const formatted: CartItem = {
							id: product.id,
							name: product.name,
							quantity: 1,
							selectedPrice: prices[0],
							unit_cost: prices[0].price,
							prices,
							image: product.images[0],
							metadata: product.metadata,
						};
						await redis.set(
							`formatted-product:${product.id}:cart-item`,
							JSON.stringify(formatted),
							"PX",
							TIME.day
						);
						return res.status(200).json(formatted);
				}
				break;
		}
	}
};

export default withSession(handler);
