import { APIEmbedField } from "discord-api-types/v10";
import { TIME } from "src/constants";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { redisConnect } from "src/util/redis";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const redis = await redisConnect();
	const product = event.data.object as Stripe.Product;
	let metadata = convertStripeMetadata(product.metadata);

	// When a product is created using the dashboard the prices
	// are added separately, for that we wait until the prices
	// have been added before creating and sending the webhook.
	const pricesFinalized = await redis.get(
		`webhooks:product-created:${product.id}`
	);
	if (metadata.hidden && (!pricesFinalized || !JSON.parse(pricesFinalized))) {
		await redis.set(
			`webhooks:product-created:${product.id}:waiting`,
			JSON.stringify(event),
			"PX",
			TIME.minute * 5
		);
		return {
			result: null,
		};
	}

	const { data: prices } = await stripe.prices.list({
		product: product.id,
		active: true,
	});

	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: product.name,
			inline: true,
		},
		{
			name: "Type",
			value: prices.length > 1 ? "Subscription" : "Single-purchase",
			inline: true,
		},
	];

	if (prices.length >= 1) {
		fields.push({
			name: `Price${prices.length !== 1 ? "s" : ""}`,
			value: prices
				.map(
					(price) =>
						`• $${(price.unit_amount! / 100).toFixed(2)} ${
							prices.length > 1
								? `every ${
										price.recurring!.interval_count > 1
											? price.recurring!.interval_count
											: ""
								  } ${price.recurring!.interval}`
								: "each"
						}`
				)
				.join("\n"),
			inline: true,
		});
	}

	if (metadata) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	await redis.del([
		`webhooks:product-created:${product.id}`,
		`webhooks:product-created:${product.id}:creator`,
		`webhooks:product-created:${product.id}:waiting`,
	]);

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Product Created",
					color: 1099597,
					thumbnail: {
						url:
							product.images[0] ||
							"http://brentapac.com/wp-content/uploads/2017/03/transparent-square.png",
					},
					...(product.description && {
						description: product.description,
					}),
					fields,
				},
			],
		},
	};
}
