import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { redisConnect } from "src/util/redis";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (event: Stripe.Event): Promise<EventResponse> {
	const redis = await redisConnect();
	const product = event.data.object as Stripe.Product;

	let metadata = convertStripeMetadata(product.metadata);
	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: product.name,
			inline: true,
		},
	];

	if (metadata) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	if (product.metadata.category === "subscription") {
		redis.del("store:products:subscriptions");
	} else if (product.metadata.category === "one-time") {
		redis.del("store:products:one-time");
	} else {
		redis.del("store:products:subscriptions");
		redis.del("store:products:one-time");
	}

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Product Deleted",
					color: 16767820,
					thumbnail: {
						url:
							product.images[0] ||
							"http://brentapac.com/wp-content/uploads/2017/03/transparent-square.png",
					},
					description:
						"This shouldn't be anything to worry about as products can't be deleted unless there are no previous purchases.",
					fields,
				},
			],
		},
	};
}
