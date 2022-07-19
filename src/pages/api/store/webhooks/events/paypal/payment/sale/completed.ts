import { APIEmbedField } from "discord-api-types/v10";
import { PurchaseRecord } from "src/pages/api/store/checkout/finalize/paypal";
import { UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { redisConnect } from "src/util/redis";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { EventResponse } from "../../../../paypal";

export const billingPeriod = {
	day: "Daily",
	week: "Weekly",
	month: "Monthly",
	year: "Annually",
};

export default async function (event: PayPalEvent, paypal: PayPal): Promise<EventResponse> {
	let fields: APIEmbedField[] = [];
	if (!event.data.custom) {
		return {
			result: null,
			error: "Old subscription. Ignore.",
			status: 200,
		};
	}

	const db = await dbConnect();
	const existingPurchase = (await db
		.collection("purchases")
		.findOne({ subscriptionId: event.data.billing_agreement_id })) as PurchaseRecord | null;

	if (existingPurchase?.confirmed) {
		return {
			result: null,
			error: "Subscription confirmation already completed. This is a duplicate event.",
			status: 200,
		};
	}
	const subscription = await paypal.subscriptions.get(event.data.billing_agreement_id!);
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
	const customerEmail =
		subscription.subscriber?.email_address ??
		(
			(await stripe.customers.search({ query: `metadata['discordId']:'${purchasedBy}'` }))
				.data as Stripe.Customer[]
		)[0].email ??
		((await db.collection("users").findOne({ _id: purchasedBy })) as UserData).email;

	fields = [
		{
			name: "Purchased by",
			value: `<@!${purchasedBy}> (${purchasedBy})\n> ${customerEmail}`,
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
					? billingPeriod[price.recurring!.interval]
					: `every ${price.recurring!.interval_count} ${price.recurring!.interval}s`
			})`,
		},
		{
			name: "Renewal",
			value: `User will be charged again on: <t:${
				new Date(subscription.billing_info?.next_billing_time!).getTime() / 1000
			}>`,
		},
	]);

	const redis = await redisConnect();
	Promise.all([
		redis.del(`customer:purchase-history:${purchasedBy}`),
		db
			.collection("purchases")
			.updateOne({ subscriptionId: event.data.billing_agreement_id! }, { $set: { confirmed: true } }),
	]);

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/paypal.png",
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
