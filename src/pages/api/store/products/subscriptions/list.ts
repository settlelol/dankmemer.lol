import { stripeConnect } from "src/util/stripe";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../../util/session";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";
import { TIME } from "../../../../../constants";
import { ListedProduct, Metadata } from "src/pages/store";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	let result: ListedProduct[] = [];

	const redis = await redisConnect();
	const cached = await redis.get("store:products:subscriptions");

	if (cached) {
		let parsedCache = JSON.parse(cached) as ListedProduct[];
		if (user.developer) {
			return res.status(200).json(parsedCache);
		}
		return res.status(200).json(parsedCache.filter((product) => !product.hidden));
	}

	try {
		const stripe: Stripe = stripeConnect();
		const { data: products } = await stripe.products.search({
			query: `active:'true' AND metadata['type']:'subscription'`,
			limit: 100,
		});

		for (const product of products) {
			const prices = (
				await stripe.prices.list({
					active: true,
					product: product.id,
					type: "recurring",
				})
			).data
				.sort((a, b) => a.unit_amount! - b.unit_amount!)
				.map((price) => ({
					id: price.id,
					value: price.unit_amount!,
					interval: {
						period: price.recurring!.interval,
						count: price.recurring!.interval_count,
					},
				}));

			result.push({
				id: product.id,
				name: product.name,
				image: product.images[0],
				created: product.created,
				prices,
				type: (product.metadata as Metadata).type!,
				hidden: JSON.parse((product.metadata as Metadata).hidden ?? "false"),
			});
		}

		await redis.set("store:products:subscriptions", JSON.stringify(result), "PX", TIME.month);

		if (user.developer) {
			return res.status(200).json(result);
		}
		return res.status(200).json(result.filter((product) => !product.hidden));
	} catch (e: any) {
		console.error(`Failed to construct subscription product list: ${e.message.replace(/"/g, "")}`);
		return res.status(500).json({ message: "Failed to construct subscription product list." });
	}
};

export default withSession(handler);
