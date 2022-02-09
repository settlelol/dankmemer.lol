import { NextApiResponse } from "next";
import { stripeConnect } from "src/util/stripe";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get")
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});

	const user = req.session.get("user");
	if (!user) return res.status(401).json({ error: "You are not logged in." });

	if (!req.query.invoice) {
		return res.status(400).json({
			error: "Invoice ID (?invoice=) is required.",
		});
	}

	try {
		const stripe = stripeConnect();
		await stripe.invoices.voidInvoice(req.query.invoice.toString());

		return res.status(200).json({ message: "Canceled" });
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({
			error: "Something went wrong trying to cancel the PaymentIntent and Invoice",
		});
	}
};

export default withSession(handler);
