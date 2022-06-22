import { CartItem, Metadata } from "src/pages/store";
import { redisConnect } from "src/util/redis";
import { TIME } from "src/constants";
import Stripe from "stripe";
import { DetailedPrice } from "src/pages/api/store/product/details";

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
			const prices: DetailedPrice[] = (
				await stripe.prices.list({
					active: true,
					product: product.id,
				})
			).data
				.sort((a, b) => a.unit_amount! - b.unit_amount!)
				.map((price) => ({
					id: price.id,
					value: price.unit_amount!,
					...(price.recurring && {
						interval: {
							period: price.recurring.interval,
							count: price.recurring.interval_count,
						},
					}),
					...((price.metadata as Metadata).paypalPlan && {
						paypalPlan: price.metadata.paypalPlan,
					}),
					...((price.metadata as Metadata).giftProduct && {
						giftProductId: price.metadata.giftProduct,
					}),
				}));
			const formatted: CartItem = {
				id: product.id,
				name: product.name,
				type: (product.metadata as Metadata).type!,
				image: product.images[0],
				selectedPrice: prices[0].id,
				prices,
				quantity: 1,
			};
			await redis.set(`formatted-product:${product.id}:cart-item`, JSON.stringify(formatted), "PX", TIME.day);
			return formatted;
		default:
			return { message: "Invalid output format" };
	}
};
