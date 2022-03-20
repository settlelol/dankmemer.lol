import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const invoiceId = req.query.invoice.toString();
	if (!invoiceId) {
		return res.status(400).json({
			error: "No invoice id was provided to finalize this purchase.",
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const { customerName, isGift, giftFor } = req.body;

	const db = await dbConnect();
	const stripe = stripeConnect();
	const _customer = await db
		.collection("customers")
		.findOne({ discordId: user.id });

	if (!_customer) {
		return res.status(500).json({
			error: "Unable to find customer. If you do not receive your purchased goods please contact support and reference the following invoice id",
			invoiceId,
		});
	}

	const invoice = await stripe.invoices.retrieve(invoiceId, {
		expand: ["payment_intent.payment_method"],
	});

	let metadata;
	let paymentIntentData: Stripe.PaymentIntentUpdateParams = {};
	let customerData: Stripe.CustomerUpdateParams = {};
	if (isGift) {
		metadata = { isGift, giftFor };
	} else if (!isGift) {
		metadata = { isGift };
	}

	const customer = (await stripe.customers.retrieve(
		_customer._id
	)) as Stripe.Customer;

	if (!customer.name) {
		customerData.name = customerName;
	}

	try {
		paymentIntentData["metadata"] = metadata;
		await stripe.customers.update(customer.id, customerData);
		await stripe.paymentIntents.update(
			(invoice.payment_intent! as Stripe.PaymentIntent).id,
			paymentIntentData
		);
		await db.collection("customers").updateOne(
			{ discordId: user.id },
			{
				$push: {
					purchases: {
						type: "stripe",
						invoice: invoice.id,
						paymentIntent: (
							invoice.payment_intent! as Stripe.PaymentIntent
						).id,
					},
				},
			}
		);
		req.session.unset("cart");
		req.session.unset("discountCode");

		await req.session.save();
		return res.status(200).json({ invoiceId });
	} catch (e: any) {
		console.error(
			`Error updating Stripe data after purchase completion: ${e.message.replace(
				/"/g,
				""
			)}`
		);
		return res.status(200).json({
			invoiceId,
			error: "An error occurred, however the payment was successful.",
		});
	}
};

export default withSession(handler);
