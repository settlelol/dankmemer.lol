import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

interface EvidenceArray {
	name: string;
	value: string;
}

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	const dispute = event.data.object as Stripe.Dispute;
	let metadata = convertStripeMetadata(dispute.metadata);

	const charge = await stripe.charges.retrieve(dispute.charge.toString());
	// const customer = (await stripe.customers.retrieve(
	// 	charge.customer as string
	// )) as Stripe.Customer;

	const fields: APIEmbedField[] = [
		// {
		// 	name: "Customer",
		// 	value: `${customer.name} (<@!${customer.metadata.discordId}>)\n> ${customer.email}`,
		// },
		{
			name: "Current status",
			value: toTitleCase(dispute.status.replace(/_/g, " ").replace("warning ", ":warning: ")),
			inline: true,
		},
		{
			name: "Dispute reason",
			value: `\`${dispute.reason}\``,
			inline: true,
		},
		{
			name: "_ _",
			value: "_ _",
			inline: true,
		},
		{
			name: "Evidence details",
			value: `• Due by: <t:${dispute.evidence_details.due_by}>\n• Already includes evidence: ${
				dispute.evidence_details.has_evidence ? "Yes" : "No"
			}`,
			inline: true,
		},
	];

	const hasEvidence = Object.values(dispute.evidence).filter((evidence) => evidence !== null).length >= 1;
	if (hasEvidence) {
		const expectFile = [
			"cancellation_policy",
			"customer_communication",
			"customer_signature",
			"duplicate_charge_documentation",
			"receipt",
			"refund_policy",
			"service_documentation",
			"shipping_documentation",
			"uncategorized_file",
		];

		let evidence: EvidenceArray[] = [];
		for (let i in Object.keys(dispute.evidence)) {
			const field = Object.keys(dispute.evidence)[i];
			const value = Object.values(dispute.evidence)[i];
			if (value) {
				if (expectFile.includes(field)) {
					const link = await stripe.fileLinks.create({
						file: value as string,
					});
					evidence.push({
						name: field,
						value: `[Download file](${link.url})`,
					});
				} else {
					evidence.push({
						name: field,
						value: value,
					});
				}
			}
		}

		fields.push({
			name: "Provided Evidence",
			value: evidence
				.map(({ name, value }) => `${toTitleCase(name.replace(/_/g, " "))}: **${value}**`)
				.join("\n"),
			inline: true,
		});
	}

	fields.push({
		name: "Disputed purchase",
		value: `Value (${dispute.currency.toUpperCase()}): **$${(dispute.amount / 100).toFixed(2)}**\nDate: <t:${
			charge.created
		}>`,
	});

	if (Object.keys(metadata).length >= 1) {
		fields.push({
			name: "Metadata",
			value: `\`\`\`json\n${JSON.stringify(metadata, null, "\t")}\`\`\``,
		});
	}

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/stripe.png",
			embeds: [
				{
					title: "Charge dispute updated",
					description: `This is just for notification's sake, it is best to view a dispute within the [Stripe dashboard](https://dashboard.stripe.com/${
						process.env.NODE_ENV === "development" ? "test/" : ""
					}payments/${
						dispute.charge
					} "Open disputed charge on the Stripe dashboard"), there you will be able to better assess this dispute.`,
					color: 6777310,
					fields,
					footer: {
						text: `Dispute ID: ${dispute.id}`,
					},
				},
			],
		},
	};
}
