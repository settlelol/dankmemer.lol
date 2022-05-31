import { APIEmbedField } from "discord-api-types/v10";
import { dbConnect } from "src/util/mongodb";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

type SubscriptionEvent<T> = Partial<T> & { plan: Stripe.Plan };

export default async function (event: Stripe.Event, stripe: Stripe): Promise<EventResponse> {
	const db = await dbConnect();
	const subscription = event.data.object as SubscriptionEvent<Stripe.Subscription>;

	const product = await stripe.products.retrieve(subscription.plan.product as string);
	const lastInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);

	let payee: string = "";
	if (lastInvoice && lastInvoice.metadata && Object.values(lastInvoice.metadata!).length >= 1) {
		payee = lastInvoice.metadata!.boughtByDiscordId;
	} else {
		const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
		payee = customer.metadata.discordId;
	}

	let fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `<@!${payee}> (${payee})\n> ${subscription.customer as string}`,
		},
		{
			name: "Subscription",
			value: `${product.name} ($${subscription.plan.amount! / 100}/${subscription.plan.interval})`,
			inline: true,
		},
		{
			name: "Duration",
			value: `<t:${subscription.start_date}> - <t:${subscription.ended_at}>`,
			inline: true,
		},
	];

	try {
		await db.collection("customers").updateOne(
			{ _id: subscription.customer! },
			{
				$unset: {
					subscription: {},
				},
			}
		);
	} catch (e: any) {
		console.error(
			`Error while remove subscription from customer (${subscription.customer!}): ${e.message.replace(/"/g, "")}`
		);
	}

	return {
		result: {
			avatar_url: process.env.DOMAIN + "/img/store/gateways/stripe.png",
			embeds: [
				{
					title: "Subscription ended",
					color: 16731212,
					fields,
				},
			],
		},
	};
}
