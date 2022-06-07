import { CartItem } from "src/pages/store";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";
import Stripe from "stripe";

interface FailedFormat {
	message: string;
}

export const formatProduct = async (
	to: "cart-item",
	productId: string,
	stripe: Stripe
): Promise<CartItem | FailedFormat> => {
	if (!to) {
		return { message: "No output format was provided." };
	}

	const redis = await redisConnect();

	switch (to) {
		case "cart-item":
			const isCached = await redis.get(`formatted-product:${productId}:cart-item`);
			if (isCached) {
				return JSON.parse(isCached) as CartItem;
			}
			const product = await stripe.products.retrieve(productId);
			if (!product) {
				return { message: "No product with the provided ID was found." };
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
			await redis.set(`formatted-product:${product.id}:cart-item`, JSON.stringify(formatted), "PX", TIME.day);
			return formatted;
		default:
			return { message: "Invalid output format" };
	}
};
