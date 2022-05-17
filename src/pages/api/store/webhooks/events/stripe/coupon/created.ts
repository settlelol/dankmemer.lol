import { APIEmbedField } from "discord-api-types/v10";
import convertStripeMetadata from "src/util/convertStripeMetadata";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { inspect } from "util";
import { EventResponse } from "../../../stripe";

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	let coupon = await stripe.coupons.retrieve(
		(event.data.object as Stripe.Coupon).id,
		{
			expand: ["applies_to"],
		}
	);
	let metadata = convertStripeMetadata(coupon.metadata || {});
	let promotion = (await stripe.promotionCodes.list({ coupon: coupon.id }))
		.data[0];

	const fields: APIEmbedField[] = [
		{
			name: "Name",
			value: `${coupon.name || "No name"} (\`${promotion.code}\`)`,
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
				? `$${
						coupon.amount_off / 100
				  } ${coupon.currency?.toUpperCase()}`
				: `${coupon.percent_off}%`,
			inline: true,
		},
	];

	if (promotion.max_redemptions || coupon.max_redemptions) {
		fields.push({
			name: "Maximum redemptions",
			value: `${
				coupon.max_redemptions
					? `• Maximum coupon redemptions: ${coupon.max_redemptions}\n`
					: ""
			}${
				promotion.max_redemptions
					? `• Maximum code redemptions: ${promotion.max_redemptions}\n`
					: ""
			}`,
			inline: true,
		});
	}

	if (coupon.applies_to && coupon.applies_to.products.length >= 1) {
		const products = [];
		for (let i in coupon.applies_to.products) {
			const product = await stripe.products.retrieve(
				coupon.applies_to.products[i as any]
			);
			products.push(product);
		}
		fields.push({
			name: "Applies to",
			value: products
				.map(
					(product) =>
						`• ${
							product.name
						} [[Manage](https://dashboard.stripe.com/${
							process.env.NODE_ENV === "development"
								? "test/"
								: ""
						}products/${product.id} "Manage '${
							product.name
						}' on Stripe")]`
				)
				.join("\n"),
			inline: true,
		});
	}

	if (
		promotion.restrictions.first_time_transaction ||
		promotion.restrictions.minimum_amount
	) {
		fields.push({
			name: "Restrictions",
			value: `${
				promotion.restrictions.first_time_transaction
					? "• Only available for first-time purchases\n"
					: ""
			}${
				promotion.restrictions.minimum_amount
					? "• Minimum purchase amount (" +
					  promotion.restrictions.minimum_amount_currency?.toUpperCase() +
					  "): **$" +
					  (promotion.restrictions.minimum_amount / 100).toFixed(2) +
					  "**"
					: ""
			}`,
			inline: true,
		});
	}

	if (promotion.expires_at || coupon.redeem_by) {
		fields.push({
			name: "Expirations",
			value: `${
				coupon.redeem_by
					? `Coupon expires at <t:${coupon.redeem_by}>\n`
					: ""
			}${
				promotion.expires_at
					? `Code expires at <t:${promotion.expires_at}>`
					: ""
			}`,
		});
	}

	if (promotion.customer) {
		const customer = (await stripe.customers.retrieve(
			promotion.customer as string
		)) as Stripe.Customer;
		fields.push({
			name: "Customer",
			value: `<@!${customer.metadata.discordId}> (${customer.metadata.discordId})\n\`${customer.id}\``,
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
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Coupon Created",
					color: 1099597,
					fields,
				},
			],
		},
	};
}
