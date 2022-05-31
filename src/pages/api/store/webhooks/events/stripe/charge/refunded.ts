import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { redisConnect } from "src/util/redis";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

interface EvidenceArray {
	name: string;
	value: string;
}

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	const charge = event.data.object as Stripe.Charge;
	let metadata = convertStripeMetadata(charge.metadata || {});

	const customer = (await stripe.customers.retrieve(charge.customer!.toString())) as Stripe.Customer;

	const fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `${customer.name} (<@!${customer.metadata.discordId}>)\n> ${customer.email}`,
		},
		{
			name: "Current status",
			value: toTitleCase(charge.status!.replace(/_/g, " ")),
			inline: true,
		},
		{
			name: "Refund reason",
			value: toTitleCase((charge.refunds.data[0].reason || "None").replace(/_/g, " ")),
			inline: true,
		},
		{
			name: "Refunded purchase",
			value: `Total value (${charge.currency.toUpperCase()}): **$${(charge.amount / 100).toFixed(
				2
			)}**\nAmount refunded: (${charge.currency.toUpperCase()}): **$${(charge.amount_refunded / 100).toFixed(
				2
			)}**\nDate: <t:${charge.created}>`,
		},
	];

	if (Object.keys(metadata).length >= 1) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	const redis = await redisConnect();
	redis.del(`customer:purchase-history:${customer.metadata.discordId}`);

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Refund",
					color: 6777310,
					fields,
					footer: {
						text: `Charge ID: ${charge.id}`,
					},
				},
			],
		},
	};
}
