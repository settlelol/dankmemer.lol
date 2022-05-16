import axios from "axios";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
// @ts-ignore
import { buffer } from "micro";

import { default as PaymentIntentSucceeded } from "./events/stripe/paymentIntent/succeeded";
import { default as ProductCreated } from "./events/stripe/product/created";
import { default as ProductDeleted } from "./events/stripe/product/deleted";
import { default as ProductUpdated } from "./events/stripe/product/updated";

import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";

export const config = {
	api: {
		bodyParser: false,
	},
};

export interface PaymentIntentItemResult {
	name: string;
	price: number;
	quantity: number;
	type: Stripe.Price.Type;
	discounts?: PaymentIntentItemDiscount[] | [];
}

export interface PaymentIntentItemDiscount {
	id: string;
	code: string;
	name: string;
	discountDecimal: number;
	discountPercentage: string;
}

export interface EventResponse {
	result: RESTPostAPIWebhookWithTokenJSONBody;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const stripe = stripeConnect();
	let event: Stripe.Event;
	let result: RESTPostAPIWebhookWithTokenJSONBody | null = null;

	const requestBuffer = await buffer(req);

	const signature = req.headers["stripe-signature"];
	const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!signingSecret) {
		console.error(`Missing environment variable 'STRIPE_WEBHOOK_SECRET'`);
		return res.status(400).json({ error: "Invalid request." });
	} else if (!signature) {
		console.error(
			"No Stripe-Signature header was provided during webhook request."
		);
		return res.status(400).json({ error: "Invalid request." });
	}

	try {
		event = stripe.webhooks.constructEvent(
			requestBuffer.toString(),
			signature,
			signingSecret
		);
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		result = {
			content: `<@!213912135409991691>`,
			embeds: [
				{
					title: `Failed Stripe signature verification`,
					color: 0xe84141,
					description: e.message.replace(/"/g, ""),
				},
			],
		};
		return res
			.status(500)
			.json({ error: "Failed Stripe signature verification" });
	}

	switch (event.type) {
		case "payment_intent.succeeded":
			result = (await PaymentIntentSucceeded(event, stripe)).result;
			break;
		case "charge.succeeded":
			const charge = event.data.object;
			console.log(charge);
			break;
		case "product.created":
			const createdRes = await ProductCreated(event, stripe);
			if (createdRes) {
				result = createdRes.result;
			}
			break;
		case "product.deleted":
			result = (await ProductDeleted(event)).result;
			break;
		case "product.updated":
			const updatedRes = await ProductUpdated(event, stripe);
			if (updatedRes) {
				result = updatedRes.result;
			}
			break;
	}

	if (result !== null) {
		if (event.livemode && result.embeds) {
			result.embeds[0].title = "(DEV) " + result.embeds[0].title;
		}
		try {
			await axios.post(process.env.STORE_WEBHOOK!, result, {
				headers: { "Content-Type": "application/json" },
			});
			return res.status(200).json({ state: "Webhook sent" });
		} catch (e: any) {
			console.warn(
				`Failed to send Discord webhook in response to Stripe webhook event. Failed on event, ${event.type}.`
			);
			return res.status(200).json({
				state: "Discord webhook failed to send",
				error: e.message.replace(/"/g, ""),
			});
		}
	} else {
		return res.status(200).json({ message: "Expecting more results." });
	}
};

export default withSession(handler);
