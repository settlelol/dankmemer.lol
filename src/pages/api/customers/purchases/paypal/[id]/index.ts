import { NextApiResponse } from "next";
import { Card } from "src/components/store/checkout/CheckoutForm";
import PayPal from "src/util/paypal";
import { NextIronRequest, withSession } from "src/util/session";

export interface PayPalPurchaseDetails {
	invoice_email: string;
	paymentMethod: Card;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	const paypal = new PayPal();
	const order = await paypal.orders.retrieve(req.query.id.toString());

	return res.status(200).json({
		order,
	});
};

export default withSession(handler);
