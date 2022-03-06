import axios from "axios";
import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
// @ts-ignore
import { buffer } from "micro";
import PayPal from "src/util/paypal";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const paypal = new PayPal();
	paypal.webhooks.constructEvent(req);

	return res.status(200).json({ a: 1 });
};

export default withSession(handler);
