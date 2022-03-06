import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { WebhookPaymentEvents } from "src/util/paypal/classes/Simulations";
import axios from "axios";
import { TIME } from "src/constants";
import { redisConnect } from "src/util/redis";

interface EmbedField {
	name: string;
	value: string;
	inline?: Boolean;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const redis = await redisConnect();
	const paypal = new PayPal();
	try {
		let event: PayPalEvent = await paypal.webhooks.constructEvent(req);
		let processedEvent = await redis.get(
			`paypal-purchase:${event.data.id}`
		);
		if (processedEvent) {
			return;
		}
		switch (event.type) {
			case WebhookPaymentEvents.CAPTURE_COMPLETED:
				await redis.set(
					`paypal-purchase:${event.data.id}`,
					event.data.id,
					"PX",
					TIME.minute * 15
				);
				sendPurchaseWebhook(event);
				break;
		}
		return res.status(200).json({ a: 1 });
	} catch (e: any) {
		if (process.env.NODE_ENV !== "production") {
			console.error(`[DEV] ${e.message.replace(/"/g, "")}`);
		}
		return res.status(500).json({ err: e });
	}
};

const sendPurchaseWebhook = async (event: PayPalEvent) => {
	let fields: EmbedField[] = [
		{
			name: "Purchased by",
			value: `<@!${event.data.purchasedBy}> (${event.data.purchasedBy})`,
			inline: true,
		},
	];

	if (event.data.isGift) {
		fields.push({
			name: "(Gift) Purchased for",
			value: `<@!${event.data.purchasedFor}> (${event.data.purchasedFor})`,
			inline: true,
		});
	}

	fields.push({
		name: "Goods purchased",
		value: `• ${event.data.items
			?.map((item) => {
				return `${item.quantity}x ${item.name} ($${item.unit_amount.value})`;
			})
			.join("\n• ")}`,
	});

	await axios.post(
		process.env.STORE_WEBHOOK!,
		{
			avatar_url:
				"https://newsroom.uk.paypal-corp.com/image/PayPal_Logo_Thumbnail.jpg",
			color: 0x1676594,
			embeds: [
				{
					title: "Successful PayPal Purchase",
					fields,
					footer: {
						text: `Total purchase value: $${event.data.total} (incl. sales tax)`,
					},
				},
			],
		},
		{
			headers: { "Content-Type": "application/json" },
		}
	);
};

export default withSession(handler);
