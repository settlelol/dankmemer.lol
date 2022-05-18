import { APIEmbedField } from "discord-api-types/v10";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { inspect } from "util";
import {
	EventResponse,
	PaymentIntentItemDiscount,
	PaymentIntentItemResult,
} from "../../../stripe";

export default async function (
	event: PayPalEvent,
	paypal: PayPal
): Promise<EventResponse> {
	const db = await dbConnect();
	let fields: APIEmbedField[] = [
		{
			name: "Purchased by",
			value: `<@!${event.data.purchasedBy}> (${event.data.purchasedBy})`,
			inline: event.data.isGift,
		},
	];

	if (event.data.isGift) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${event.data.purchasedFor}> (${event.data.purchasedFor})`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	fields.push({
		name: "Goods purchased",
		value: `• ${event.data.items
			?.map((item) => {
				return `${item.quantity}x ${item.name} ($${item.unit_amount.value})`;
			})
			.join("\n• ")}`,
		inline: true,
	});

	const record = await db
		.collection("purchases")
		.findOne({ _id: event.data.order_id });

	if (record) {
		let discounts: PaymentIntentItemDiscount[] = [];
		const items: PaymentIntentItemResult[] = record.items;

		for (let i in items) {
			if (items[i].discounts && items[i].discounts!.length >= 1) {
				for (let j in items[i].discounts) {
					discounts = [...discounts, items[i].discounts![j as any]];
				}
			}
		}

		discounts = Array.from(new Set(discounts));

		fields.push({
			name: "Discounts applied",
			value: `${discounts
				.map((discount) => {
					const discountedItems = items.filter(
						(item: PaymentIntentItemResult) =>
							item.discounts?.find((d) => d.id === discount.id)
					);
					const itemsText = discountedItems.map(
						(item: PaymentIntentItemResult) => {
							return `> ${item?.name} (-$${(
								item?.price! *
								(discount.discountDecimal / 100)
							).toFixed(2)})`;
						}
					);
					return `**${discount.name}** (\`${discount.code}\`) - ${
						discount.discountPercentage
					}\n${itemsText.join("\n")}`;
				})
				.join("\n")}`,
			inline: true,
		});
		fields.push({ name: "_ _", value: "_ _", inline: true }); // Add an invisible embed field
	}

	return {
		result: {
			avatar_url:
				"https://newsroom.uk.paypal-corp.com/image/PayPal_Logo_Thumbnail.jpg",
			embeds: [
				{
					title: "Successful PayPal Purchase",
					color: 2777007,
					fields,
					footer: {
						text: `Total purchase value: $${event.data.total} (incl. sales tax)`,
					},
				},
			],
		},
	};
}
