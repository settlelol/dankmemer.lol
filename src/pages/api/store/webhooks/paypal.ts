import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import PayPal from "src/util/paypal";
import { PayPalEvent, WebhookEvents } from "src/util/paypal/classes/Webhooks";
import axios from "axios";
import { TIME } from "src/constants";
import { redisConnect } from "src/util/redis";
import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";

import { default as CaptureCompleted } from "./events/paypal/payment/capture/completed";
import { default as PlanCreated } from "./events/paypal/billing/plan/created";
import { default as SubscriptionCancelled } from "./events/paypal/billing/subscription/cancelled";
import { default as ProductCreated } from "./events/paypal/product/created";
import { default as SaleCompleted } from "./events/paypal/payment/sale/completed";

export interface EventResponse {
	result: RESTPostAPIWebhookWithTokenJSONBody | null;
	error?: string;
	status?: number;
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
		let status: number | undefined;

		let processedEvent = await redis.get(`paypal-purchase:${event.data.id}`);
		if (processedEvent) {
			return res.status(200).json({ message: "Event already processed" });
		}

		switch (event.type) {
			case WebhookEvents.CAPTURE_COMPLETED:
				({ result, error } = await CaptureCompleted(event, paypal));
				break;
			case WebhookEvents.PLAN_CREATED:
				({ result, error } = await PlanCreated(event));
				break;
			case WebhookEvents.PRODUCT_CREATED:
				({ result, error, status } = await ProductCreated(event));
				break;
			case WebhookEvents.SALE_COMPLETED:
				({ result, error } = await SaleCompleted(event, paypal));
				break;
			case WebhookEvents.SUBSCRIPTION_CANCELLED:
				({ result, error } = await SubscriptionCancelled(event, paypal));
				break;
			default:
				({ error, status } = {
					error: `Not expected to handle event type, ${event.type}`,
					status: 200,
				});
		}

		await redis.set(`paypal-event-for:${event.type}:${event.data.id}`, event.data.id, "PX", TIME.minute * 15);

		if (result !== null && !error) {
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
					`Failed to send Discord webhook in response to PayPal webhook event. Failed on event, ${
						event.type
					}.\nMessage: ${e.message.replace(/"/g, "")}`
				);
				return res.status(200).json({
					state: "Discord webhook failed to send",
					error: e.message.replace(/"/g, ""),
				});
			}
		} else if (result === null && error && status) {
			return res.status(status).json({ message: error });
		} else {
			return res.status(500).json({ message: error });
		}
	} catch (e: any) {
		if (process.env.NODE_ENV !== "production") {
			console.error(`[DEV] ${e.message.replace(/"/g, "")}`);
			return res.status(200).json({ message: e.message.replace(/"/g, "") });
		}
		return res.status(500).json({ message: e.message.replace(/"/g, "") });
	}
};

export default withSession(handler);
