import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../stripe";

export default async function (event: Stripe.Event): Promise<EventResponse> {
	let coupon = event.data.object as Stripe.Coupon;
	let metadata = convertStripeMetadata(coupon.metadata || {});

	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: `${coupon.name || "No name"}`,
			inline: true,
		},
		{
			name: "Duration",
			value: `${toTitleCase(coupon.duration)}`,
			inline: true,
		},
		{
			name: "Discount provided",
			value: coupon.amount_off
				? `$${coupon.amount_off / 100} ${coupon.currency?.toUpperCase()}`
				: `${coupon.percent_off}%`,
			inline: true,
		},
		{
			name: "Redemptions",
			value: `• Coupon redemptions: ${coupon.times_redeemed}`,
			inline: true,
		},
	];

	if (coupon.max_redemptions) {
		fields.push({
			name: "Maximum redemptions",
			value: `${coupon.max_redemptions ? `• Maximum coupon redemptions: ${coupon.max_redemptions}\n` : ""}`,
			inline: true,
		});
	}

	if (coupon.redeem_by) {
		fields.push({
			name: "Expirations",
			value: `${coupon.redeem_by ? `Coupon expires at <t:${coupon.redeem_by}>\n` : ""}`,
		});
	}

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
					title: "Coupon Deleted",
					color: 16731212,
					fields,
				},
			],
		},
	};
}
