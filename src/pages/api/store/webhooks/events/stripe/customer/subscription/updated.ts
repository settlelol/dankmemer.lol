import { APIEmbedField } from "discord-api-types/v10";
import { toTitleCase } from "src/util/string";
import Stripe from "stripe";
import { EventResponse } from "../../../../stripe";

type SubscriptionEvent<T> = Partial<T> & { plan: Stripe.Plan };

export default async function (
	event: Stripe.Event,
	stripe: Stripe
): Promise<EventResponse> {
	const subscription = event.data
		.object as SubscriptionEvent<Stripe.Subscription>;

	if (
		subscription.status === "incomplete" ||
		subscription.status === "incomplete_expired"
	) {
		return {
			result: null,
		};
	}

	const product = await stripe.products.retrieve(
		subscription.plan.product as string
	);

	const lastInvoice = await stripe.invoices.retrieve(
		subscription.latest_invoice as string
	);
	let payee: string = "";
	if (
		lastInvoice &&
		lastInvoice.metadata &&
		Object.values(lastInvoice.metadata!).length >= 1
	) {
		payee = lastInvoice.metadata!.boughtByDiscordId;
	} else {
		const customer = (await stripe.customers.retrieve(
			subscription.customer as string
		)) as Stripe.Customer;
		payee = customer.metadata.discordId;
	}

	const updatedFields = Object.keys(event.data.previous_attributes!);
	let fields: APIEmbedField[] = [
		{
			name: "Customer",
			value: `<@!${payee}> (${payee})\n> ${
				subscription.customer as string
			}`,
		},
	];

	if (false) {
		fields.push({
			name: "Updated attributes",
			value: `${updatedFields
				.map(
					(k) =>
						`**${toTitleCase(k.replace(/_/g, " "))}**\n> \`${
							event.data.previous_attributes![
								k as keyof typeof event.data.previous_attributes
							]
						}\` -> \`${
							subscription[k as keyof typeof subscription]
						}\``
				)
				.join("\n")}`,
		});
	}

	if (updatedFields.includes("plan")) {
		const oldPlan = event.data.previous_attributes![
			"plan" as keyof typeof event.data.previous_attributes
		] as Stripe.Plan;
		const oldProduct = await stripe.products.retrieve(
			oldPlan.product as string
		);

		fields.push({
			name: "Subscription",
			value: `OLD: ${oldProduct.name} ($${(oldPlan.amount! / 100).toFixed(
				2
			)}/${oldPlan.interval})\nNEW: ${product.name} ($${(
				subscription.plan.amount! / 100
			).toFixed(2)}/${subscription.plan.interval})`,
			inline: true,
		});
	} else {
		fields.push({
			name: "Subscription",
			value: `${product.name} ($${subscription.plan.amount! / 100}/${
				subscription.plan.interval
			})`,
			inline: true,
		});
	}

	if (updatedFields.includes("status")) {
		fields.push({
			name: "Status",
			value: `**${toTitleCase(
				(
					updatedFields[
						"status" as keyof typeof event.data.previous_attributes
					] || "unknown"
				).replace(/_/g, " ")
			)}** -> **${toTitleCase(
				(subscription.status || "unknown").replace(/_/g, " ")
			)}**`,
			inline: true,
		});
	} else {
		fields.push({
			name: "Status",
			value: toTitleCase(
				(subscription.status || "unknown").replace(/_/g, " ")
			),
			inline: true,
		});
	}

	if (updatedFields.includes("collection_method")) {
		fields.push({
			name: "Collection method",
			value: `**${toTitleCase(
				(
					updatedFields[
						"collection_method" as keyof typeof event.data.previous_attributes
					] || "unknown"
				).replace(/_/g, " ")
			)}** -> **${toTitleCase(
				(subscription.status || "unknown").replace(/_/g, " ")
			)}**`,
		});
	}

	return {
		result: {
			avatar_url: "https://stripe.com/img/v3/home/twitter.png",
			embeds: [
				{
					title: "Subscription updated",
					color: 6777310,
					fields,
				},
			],
		},
	};
}
