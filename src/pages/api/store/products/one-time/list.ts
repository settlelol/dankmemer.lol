import { stripeConnect } from "src/util/stripe";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../../util/session";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";
import { STORE_BLOCKED_COUNTRIES, TIME } from "../../../../../constants";
import { ListedProduct, Metadata } from "src/pages/store";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	let result: ListedProduct[] = [];

	const country = req.headers["cf-ipcountry"];
	const redis = await redisConnect();
	const cached = await redis.get("store:products:one-time");

	if (cached) {
		let parsedCache = JSON.parse(cached) as ListedProduct[];
		if (user.developer) {
			return res.status(200).json(parsedCache);
		}
		let visibleProducts = parsedCache.filter((product) => !product.hidden);
		if (country && STORE_BLOCKED_COUNTRIES.includes(country as string)) {
			return res.status(200).json(visibleProducts.filter((product) => product.category !== "lootbox"));
		}
		return res.status(200).json(visibleProducts);
	}

	try {
		const stripe: Stripe = stripeConnect();
		const { data: products } = await stripe.products.list({
			active: true,
			limit: 100,
		});

		for (const product of products) {
			const prices = (
				await stripe.prices.list({
					active: true,
					product: product.id,
					type: "one_time",
				})
			).data.map((price) => ({
				id: price.id,
				value: price.unit_amount!,
			}));
			if (prices[0]) {
				if (product.metadata.type !== "giftable") {
					result.push({
						id: product.id,
						name: product.name,
						image: product.images[0],
						created: product.created,
						prices,
						type: (product.metadata as Metadata).type!,
						category: (product.metadata as Metadata).category,
						hidden: JSON.parse((product.metadata as Metadata).hidden ?? "false"),
					});
				}
			}
		}

		await redis.set("store:products:one-time", JSON.stringify(result), "PX", TIME.month);

		if (user.developer) {
			return res.status(200).json(result);
		}
		let visibleProducts = result.filter((product) => !product.hidden);
		if (country && STORE_BLOCKED_COUNTRIES.includes(country as string)) {
			return res.status(200).json(visibleProducts.filter((product) => product.category !== "lootbox"));
		}
		return res.status(200).json(visibleProducts);
	} catch (e: any) {
		console.error(`Failed to construct one-time product list: ${e.message.replace(/"/g, "")}`);
		return res.status(500).json({ message: "Failed to construct one-time product list." });
	}
};

export default withSession(handler);
