import { TIME } from "src/constants";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { redisConnect } from "src/util/redis";
import { EventResponse } from "../../../../paypal";

import { default as ProductCreated } from "../../product/created";

export default async function (event: PayPalEvent): Promise<EventResponse> {
	const redis = await redisConnect();
	const expectingMultiple = await redis.get(
		`webhooks:product-created:${event.data.product_id}:billing-plans`
	);
	if (expectingMultiple) {
		const numberExpected = (JSON.parse(expectingMultiple) as string[])
			.length;
		let numberOfPricesReceived: string | number = (await redis.get(
			`webhooks:product-created:${event.data.product_id}:billing-plans:received`
		)) as string;
		if (!numberOfPricesReceived) {
			return {
				result: null,
				error: "Expected number billing plans received to be cached.",
			};
		}
		numberOfPricesReceived = parseInt(numberOfPricesReceived as string);
		if (numberOfPricesReceived + 1 >= numberExpected) {
			await redis.set(
				`webhooks:product-created:${event.data.product_id}:paypal`,
				JSON.stringify(true),
				"PX",
				TIME.minute * 5
			);
			const productEvent = await redis.get(
				`webhooks:product-created:${event.data.product_id}:paypal:waiting`
			);
			if (!productEvent) {
				const createdBy = await redis.get(
					`webhooks:product-created:${event.data.product_id}:paypal:creator`
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
					result: (await ProductCreated(JSON.parse(productEvent)))!
						.result,
				};
			}
		} else if (numberOfPricesReceived < numberExpected) {
			await redis.incr(
				`webhooks:product-created:${event.data.product_id}:billing-plans:received`
			);
		}
	}

	return {
		result: null,
	};
}
