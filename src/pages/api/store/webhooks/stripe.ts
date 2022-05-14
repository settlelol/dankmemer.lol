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
		throw `Missing environment variable 'STRIPE_WEBHOOK_SECRET'`;
	} else if (!signature) {
		return console.error(
			"No Stripe-Signature header was provided during webhook request."
		);
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
			result = (await ProductCreated(event, stripe)).result;
			break;
		case "product.deleted":
			result = (await ProductDeleted(event)).result;
			break;
		case "product.updated":
			const updated = await ProductUpdated(event, stripe);
			if (updated) {
				result = updated.result;
			}
			break;
	}

	if (result !== null) {
		if (event.livemode && result.embeds) {
			result.embeds[0].title = "(DEV) " + result.embeds[0].title;
		}
		await axios.post(process.env.STORE_WEBHOOK!, result, {
			headers: { "Content-Type": "application/json" },
		});
	}

	return res.status(200).json({ event });
};

export default withSession(handler);
