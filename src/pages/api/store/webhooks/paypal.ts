import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import PayPal from "src/util/paypal";
import { PayPalEvent, WebhookEvents } from "src/util/paypal/classes/Webhooks";
import axios from "axios";
import { TIME } from "src/constants";
import { redisConnect } from "src/util/redis";
import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";

import { default as CaptureCompleted } from "./events/paypal/payment/capture/completed";

export interface EventResponse {
	result: RESTPostAPIWebhookWithTokenJSONBody | null;
	error?: string;
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
		let result: RESTPostAPIWebhookWithTokenJSONBody | null = null;
		let error: string | undefined;

		let processedEvent = await redis.get(
			`paypal-purchase:${event.data.id}`
		);
		if (processedEvent) {
			return res.status(200).json({ message: "Event already processed" });
		}

		switch (event.type) {
			case WebhookEvents.CAPTURE_COMPLETED:
				({ result, error } = await CaptureCompleted(event, paypal));
				break;
		}

		await redis.set(
			`paypal-purchase:${event.data.id}`,
			event.data.id,
			"PX",
			TIME.minute * 15
		);

		if (result !== null) {
			if (process.env.NODE_ENV === "development" && result.embeds) {
				result.embeds[0].title = "(DEV) " + result.embeds[0].title;
			}
			try {
				await axios.post(process.env.STORE_WEBHOOK!, result, {
					headers: { "Content-Type": "application/json" },
				});
				return res.status(200).json({ state: "Webhook sent" });
			} catch (e: any) {
				console.warn(
					`Failed to send Discord webhook in response to Stripe webhook event. Failed on event, ${
						event.type
					}.\nMessage: ${e.message.replace(/"/g, "")}`
				);
				return res.status(200).json({
					state: "Discord webhook failed to send",
					error: e.message.replace(/"/g, ""),
				});
			}
		} else {
			return res.status(500).json({ message: error });
		}
	} catch (e: any) {
		if (process.env.NODE_ENV !== "production") {
			console.error(`[DEV] ${e.message.replace(/"/g, "")}`);
		}
		return res.status(500).json({ message: e });
	}
};

export default withSession(handler);
