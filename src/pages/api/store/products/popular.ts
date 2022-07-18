import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { stripeConnect } from "src/util/stripe";
import { dbConnect } from "src/util/mongodb";
import { PurchaseRecord } from "../checkout/finalize/paypal";
import { UpsellProduct } from "src/pages/store/cart";
import { Metadata } from "src/pages/store";
import { redisConnect } from "src/util/redis";
import { STORE_BLOCKED_COUNTRIES, STORE_CUSTOM_MIN_AGE, TIME } from "src/constants";
import { UserData } from "src/types";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const db = await dbConnect();
	const stripe = stripeConnect();
	const redis = await redisConnect();
	const country = req.headers["cf-ipcountry"] as string;
	const userVerification = ((await db.collection("users").findOne({ _id: user.id })) as UserData).ageVerification;
	const restrictResults =
		country &&
		(STORE_BLOCKED_COUNTRIES.includes(country) ||
			(!STORE_BLOCKED_COUNTRIES.includes(country) &&
				userVerification &&
				userVerification.verified &&
				((Object.keys(STORE_CUSTOM_MIN_AGE).includes(country) &&
					// Check if the user is at least the minimum age for the country
					userVerification.years < STORE_CUSTOM_MIN_AGE[country as keyof typeof STORE_CUSTOM_MIN_AGE]) ||
					// Default to the minimum age for most countries
					userVerification.years < 18)));
	const cache = restrictResults ? "store:popular-purchases:restricted" : "store:popular-purchases";
	const cached = await redis.get(cache);
	if (cached && JSON.parse(cached).length >= 1) {
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
			if (restrictResults && !itemCounts[item.id!]) {
				const product = await stripe.products.retrieve(item.id!);
				if ((product.metadata as Metadata).category === "lootbox") break;
			}
			itemCounts[item.id!] = (itemCounts[item.id!] ?? 0) + item.quantity;
		}
	}

	let sortedPurchases = Object.fromEntries(Object.entries(itemCounts).sort(([_, a], [__, b]) => b - a));
	const top3 = Object.keys(sortedPurchases).slice(0, 3);
	const popularProducts: UpsellProduct[] = [];

	for (let productId of top3) {
		const product = await stripe.products.retrieve(productId);
		let prices = (
			await stripe.prices.list({
				product: product.id,
				active: true,
			})
		).data;
		if (prices.length > 1) {
			prices = prices.sort((a, b) => a.unit_amount! - b.unit_amount!);
		}

		popularProducts.push({
			id: product.id,
			image: product.images[0],
			name: product.name,
			type: (product.metadata as Metadata).type!,
			...((product.metadata as Metadata).category && { category: (product.metadata as Metadata).category }),
			prices: prices.map((price) => ({
				id: price.id,
				value: price.unit_amount!,
			})),
		});
	}

	await redis.set(cache, JSON.stringify(popularProducts), "PX", TIME.month);
	return res.status(200).json(popularProducts);
};

export default withSession(handler);
