import { TIME } from "src/constants";
import { redisConnect } from "src/util/redis";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";
import { default as ProductCreated } from "../product/created";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const price = event.data.object as Stripe.Price;
	const redis = await redisConnect();
	const expectingMultiple = await redis.get(
		`webhooks:product-created:${price.product}:prices:expected`
	);
	if (expectingMultiple) {
		const numberExpected = parseInt(expectingMultiple);
		let numberOfPricesReceived: string | number = (await redis.get(
			`webhooks:product-created:${price.product}:prices:received`
		)) as string;
		if (!numberOfPricesReceived) {
			return {
				result: {
					content: "?",
				},
			};
		}
		numberOfPricesReceived = parseInt(numberOfPricesReceived as string);
		if (numberOfPricesReceived + 1 === numberExpected) {
			await redis.del([
				`webhooks:product-created:${price.product}:prices:received`,
				`webhooks:product-created:${price.product}:prices:expected`,
			]);
			await redis.set(
				`webhooks:product-created:${price.product}`,
				JSON.stringify(true),
				"PX",
				TIME.minute * 5
			);
			const productEvent = await redis.get(
				`webhooks:product-created:${price.product}:waiting`
			);
			if (!productEvent) {
				const createdBy = await redis.get(
					`webhooks:product-created:${price.product}:creator`
				);
				return {
					result: {
						...(createdBy && { content: `<@!${createdBy}>` }),
						embeds: [
							{
								title: "Failed to construct complete product creation webhook",
								description:
									"The product creation should be completed but needs to be manually checked.",
							},
						],
					},
				};
			} else {
				return {
					result: (await ProductCreated(
						JSON.parse(productEvent),
						stripe
					))!.result,
				};
			}
		} else if (numberOfPricesReceived < numberExpected) {
			await redis.incr(
				`webhooks:product-created:${price.product}:prices:received`
			);
		}
	}

	return {
		result: {},
	};
}
