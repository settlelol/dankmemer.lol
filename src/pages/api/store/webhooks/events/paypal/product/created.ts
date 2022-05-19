import { APIEmbedField } from "discord-api-types/v10";
import { TIME } from "src/constants";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { redisConnect } from "src/util/redis";
import { stripeConnect } from "src/util/stripe";
import { EventResponse } from "../../../paypal";

interface BillingPlansCache {
	paypal: string;
	stripe: string;
}

export default async function (event: PayPalEvent): Promise<EventResponse> {
	const redis = await redisConnect();
	const waiting = await redis.get(
		`webhooks:product-created:${event.data.id}:paypal`
	);

	if (!waiting) {
		await redis.set(
			`webhooks:product-created:${event.data.id}:paypal:waiting`,
			JSON.stringify(event),
			"PX",
			TIME.minute * 15
		);
		return {
			result: null,
			error: "Waiting for billing plans to be received.",
			status: 200,
		};
	}

	const stripe = stripeConnect();
	const billingPlans = await redis.get(
		`webhooks:product-created:${event.data.id}:billing-plans`
	);
	const billingPlansArray: BillingPlansCache[] = JSON.parse(billingPlans!);

	let fieldValue = "";

	for (let i in billingPlansArray) {
		const stripePrice = await stripe.prices.retrieve(
			billingPlansArray[i].stripe
		);
		fieldValue += `• $${(stripePrice.unit_amount! / 100).toFixed(2)} ${
			stripePrice.recurring!.interval_count > 1
				? stripePrice.recurring!.interval_count
				: ""
		} ${stripePrice.recurring!.interval}${
			stripePrice.recurring!.interval_count > 1 ? "s" : ""
		}\n> \`${stripePrice.id}\`\n`;
	}

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
			}\`\n[[Open on Stripe](https://dashboard.stripe.com/${
				process.env.NODE_ENV === "development" ? "test/" : ""
			}products/${event.data.id})]`,
			inline: true,
		},
		{
			name: "Billing plans",
			value: fieldValue,
			inline: true,
		},
	];

	await redis.del([
		`webhooks:product-created:${event.data.id}:billing-plans`,
		`webhooks:product-created:${event.data.id}:billing-plans:received`,
	]);

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
