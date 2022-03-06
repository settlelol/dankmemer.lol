import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import PayPal from "src/util/paypal";
import { PayPalEvent } from "src/util/paypal/classes/Webhooks";
import { WebhookPaymentEvents } from "src/util/paypal/classes/Simulations";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const paypal = new PayPal();
	try {
		let event: PayPalEvent = await paypal.webhooks.constructEvent(req);
		switch (event.type) {
			case WebhookPaymentEvents.CAPTURE_COMPLETED:
				console.log(event);
				break;
		}
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
	}

	return res.status(200).json({ a: 1 });
};

export default withSession(handler);
