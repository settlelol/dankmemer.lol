import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const refund = event.data.object as Stripe.Refund;
	let metadata = convertStripeMetadata(refund.metadata || {});
	let payment: Stripe.Charge | Stripe.PaymentIntent =
		"" as any as Stripe.Charge;
	if (refund.charge) {
		payment = await stripe.charges.retrieve(refund.charge.toString());
	} else if (refund.payment_intent) {
		payment = await stripe.paymentIntents.retrieve(
			refund.payment_intent.toString()
		);
	}

	const customer = (await stripe.customers.retrieve(
		payment.customer!.toString()
	)) as Stripe.Customer;

	const fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `${customer.name} (<@!${customer.metadata.discordId}>)\n> ${customer.email}`,
		},
		{
			name: "Current status",
			value: toTitleCase(refund.status!.replace(/_/g, " ")),
			inline: true,
		},
		{
			name: "Refund reason",
			value: `\`${refund.reason}\``,
			inline: true,
		},
		{
			name: "Purchase information",
			value: `Value (${refund.currency.toUpperCase()}): **$${(
				refund.amount / 100
			).toFixed(2)}**\nDate: <t:${refund.created}>`,
		},
	];

	if (Object.keys(metadata).length >= 1) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Refund updated",
					color: 6777310,
					fields,
					footer: {
						text: `Refund ID: ${refund.id}`,
					},
				},
			],
		},
	};
}
