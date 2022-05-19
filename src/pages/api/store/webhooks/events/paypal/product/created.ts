import { APIEmbedField } from "discord-api-types/v10";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { EventResponse } from "../../../paypal";

export default async function (event: PayPalEvent): Promise<EventResponse> {
	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: event.data.name!,
			inline: true,
		},
		{
			name: "Associated with",
			value: `\`${
				event.data.id
			}\` [[Open on Stripe](https://dashboard.stripe.com/${
				process.env.NODE_ENV === "development" ? "test/" : ""
			}products/${event.data.id})]`,
			inline: true,
		},
	];

	return {
		result: {
			embeds: [
				{
					title: "Product Created",
					color: 1099597,
					fields,
				},
			],
		},
	};
}
