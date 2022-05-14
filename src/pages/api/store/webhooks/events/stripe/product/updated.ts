import { APIEmbedField, APIEmbed } from "discord-api-types/v10";
import { TIME } from "src/constants";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { redisConnect } from "src/util/redis";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse | null> {
	const redis = await redisConnect();
	const product = event.data.object as Stripe.Product;

	const cached = await redis.get(`webhooks:product-updated:${product.id}`);
	if (cached) {
		return null;
	}

	const { data: prices } = await stripe.prices.list({
		product: product.id,
		active: true,
	});

	let metadata = convertStripeMetadata(product.metadata);
	let embeds: APIEmbed[] = [];
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

	if (product.metadata && metadata.hidden && product.images.length >= 1) {
		try {
			metadata.hidden = ""; // Delete the field by giving it an empty string as a value
			const updated = await stripe.products.update(product.id, {
				metadata: metadata as Stripe.Emptyable<Stripe.MetadataParam>,
			});
			redis.set(
				`webhooks:product-updated:${product.id}`,
				JSON.stringify(updated),
				"PX",
				TIME.second * 10
			);
			delete metadata.hidden; // Remove the field for the webhook
		} catch (e: any) {
			console.error(e);
			embeds.push({
				title: "Failed to change product state.",
				description: `When a product is created using the dashboard it is not available for purchase by users. To make a product purchasable an image needs to be added through the [Stripe dashboard](https://dashboard.stripe.com/${
					process.env.NODE_ENV === "development" ? "test/" : ""
				}dashboard "Open Stripe dashboard"). This has been completed, however the product's metadata was not changed, meaning that the product cannot be purchased. This can be manually adjusted by navigating to [the product page](https://dashboard.stripe.com/${
					process.env.NODE_ENV === "development" ? "test/" : ""
				}products/${product.id}) and editing the metadata yourself.`,
				color: 16731212,
				fields: [
					{
						name: "Error",
						value: e.message.replace(/"/g, ""),
					},
				],
			});
		}
	}

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

	if (metadata || product) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}
	embeds.push({
		title: "Product Updated",
		color: 16767820,
		thumbnail: {
			url:
				product.images[0] ||
				"http://brentapac.com/wp-content/uploads/2017/03/transparent-square.png",
		},
		...(product.description && {
			description: product.description,
		}),
		fields,
	});

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds,
		},
	};
}
