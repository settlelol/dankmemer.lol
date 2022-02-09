import axios from "axios";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
// @ts-ignore
import { buffer } from "micro";

export const config = {
	api: {
		bodyParser: false,
	},
};

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const stripe = stripeConnect();
	let event: Stripe.Event;
	let result: any = null;

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
					timestamp: new Date(),
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
			const paymentIntent = event.data.object;
			console.log(paymentIntent);
			break;
		case "charge.succeeded":
			const charge = event.data.object;
			console.log(charge);
			break;
	}

	if (result !== null) {
		await axios.post(process.env.COMMUNITY_WEBHOOK!, result, {
			headers: { "Content-Type": "application/json" },
		});
	}

	return res.status(200).json({ event });
};

export default withSession(handler);
