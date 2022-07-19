import { APIEmbedField } from "discord-api-types/v10";
import { billingPeriod } from "src/components/store/cart/CartItem";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { stripeConnect } from "src/util/stripe";
import { EventResponse } from "../../../../paypal";

export default async function (event: PayPalEvent, paypal: PayPal): Promise<EventResponse> {
	const stripe = stripeConnect();
	const purchaser = event.data.custom_id!.split(":")[1];
	const subscription = await paypal.subscriptions.get(event.data.id);
	const plan = await paypal.plans.retrieve(event.data.plan_id!);
	const stripeProduct = await stripe.products.retrieve(plan.product_id);
	const stripePrice = (await stripe.prices.list({ active: true, product: stripeProduct.id })).data.find(
		(price) => (price.unit_amount! / 100).toString() === plan.billing_cycles[0].pricing_scheme?.fixed_price?.value
	)!;

	const estCancelDate = new Date(subscription.billing_info?.last_payment?.time!);
	const fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `<@!${purchaser}> (${purchaser})`,
		},
		{
			name: "Subscription",
			value: `${stripeProduct.name} (${billingPeriod[stripePrice?.recurring!.interval!]})`,
			inline: true,
		},
		{
			name: "Estimated cancellation date",
			value: `<t:${new Date(new Date(estCancelDate).setMonth(estCancelDate.getMonth() + 1)).getTime() / 1000}>`,
			inline: true,
		},
	];

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/paypal.png",
			embeds: [
				{
					title: "PayPal Subscription Cancelled",
					color: 16731212,
					fields,
				},
			],
		},
	};
}
