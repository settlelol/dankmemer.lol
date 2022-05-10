import { APIEmbedField } from "discord-api-types/v10";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const product = event.data.object as Stripe.Product;
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
		{
			name: `Price${prices.length !== 1 ? "s" : ""}`,
			value: prices
				.map((price) => `$${price.unit_amount! * 100}`)
				.join(", "),
			inline: true,
		},
	];
	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Product Deleted",
					color: 16767820,
					description:
						"This shouldn't be anything to worry about as products can't be deleted unless there are no previous purchases.",
					fields,
				},
			],
		},
	};
}
