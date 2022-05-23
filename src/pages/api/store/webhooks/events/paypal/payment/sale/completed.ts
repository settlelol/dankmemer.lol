import { APIEmbedField } from "discord-api-types/v10";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { stripeConnect } from "src/util/stripe";
import { EventResponse } from "../../../../paypal";

export default async function (
	event: PayPalEvent,
	paypal: PayPal
): Promise<EventResponse> {
	let fields: APIEmbedField[] = [];
	console.log(event);
	if (!event.data.custom) {
		return {
			result: null,
			error: "Old subscription. Ignore.",
			status: 200,
		};
	}

	const subscription = await paypal.subscriptions.get(
		event.data.billing_agreement_id!
	);
	const plan = event.data.custom!.split(":")[0];
	const purchasedBy = event.data.custom!.split(":")[1];
	const purchasedFor = event.data.custom!.split(":")[2];
	const isGift = purchasedBy !== purchasedFor;

	const stripe = stripeConnect();
	const price = (
		await stripe.prices.search({
			query: `active: 'true' AND metadata['paypalPlan']: '${plan}'`,
		})
	).data[0];

	if (!price) {
		return {
			result: null,
			error: "Unable to retrieve associated Stripe price object.",
			status: 200,
		};
	}

	const product = await stripe.products.retrieve(price.product as string);
	let billingPeriod;
	switch (price.recurring!.interval) {
		case "day":
			billingPeriod = "Daily";
			break;
		case "week":
			billingPeriod = "Weekly";
			break;
		case "month":
			billingPeriod = "Monthly";
			break;
		case "year":
			billingPeriod = "Annually";
			break;
		default:
			billingPeriod = "Unknown";
			break;
	}
	fields = [
		{
			name: "Purchased by",
			value: `<@!${purchasedBy}> (${purchasedBy})`,
			inline: isGift,
		},
	];

	if (isGift) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${purchasedFor}> (${purchasedFor})`,
			inline: true,
		});
	}

	// TODO: InBlue - Perhaps have insights to individual products as their own page on the control panel,
	// if I make that add a link here to view the specific product page.
	fields.push.apply(fields, [
		{
			name: "Subscription",
			value: `${product.name} (${
				price.recurring!.interval_count === 1
					? billingPeriod
					: `every ${price.recurring!.interval_count} ${
							price.recurring!.interval
					  }s`
			})`,
		},
		{
			name: "Renewal",
			value: `User will be charged again on: <t:${
				new Date(
					subscription.billing_info?.next_billing_time!
				).getTime() / 1000
			}>`,
		},
	]);

	return {
		result: {
			avatar_url:
				"https://newsroom.uk.paypal-corp.com/image/PayPal_Logo_Thumbnail.jpg",
			embeds: [
				{
					title: "Successful PayPal Purchase (Subscription)",
					color: 2777007,
					fields,
				},
			],
		},
	};
}
