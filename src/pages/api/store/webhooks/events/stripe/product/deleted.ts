import { APIEmbedField } from "discord-api-types/v10";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const product = event.data.object as Stripe.Product;

	const metadata = Object.keys(product.metadata)
		.map(
			(metadata, i) =>
				`${metadata}: ${Object.values(product.metadata)[i]}`
		)
		.join("\n");
	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: product.name,
			inline: true,
		},
		{
			name: "Metadata",
			value: metadata.length >= 1 ? metadata : "None",
		},
	];
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
