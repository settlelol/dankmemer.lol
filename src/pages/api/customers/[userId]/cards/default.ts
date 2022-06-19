import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "src/util/session";
import { Customer } from "..";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!req.query.userId) {
		return res.status(406).json({
			error: "No user provided?",
		});
	}

	if (!req.body.id) {
		return res.status(406).json({
			message: "No payment method id was provided.",
		});
	}

	const db: Db = await dbConnect();
	const _customer = (await db.collection("customers").findOne({ discordId: req.query.userId })) as Customer;
	const stripe = stripeConnect();

	if (user.id !== req.query.userId) {
		return res.status(401).json({ error: "You cannot access this information." });
	}
	let customer: Stripe.Customer | undefined;
	if (!_customer) {
		const unrecordedCustomer = (
			await stripe.customers.search({
				query: `metadata['discordId']: '${user.id}' OR email:'${user.email}'`,
			})
		).data[0];

		if (unrecordedCustomer) {
			customer = unrecordedCustomer;
		} else {
			return res.status(404).json({
				error: "Requested user was not found in the database.",
			});
		}
	} else {
		customer = (await stripe.customers.retrieve(_customer._id)) as Stripe.Customer;
	}

	try {
		await stripe.customers.update(customer.id, {
			invoice_settings: {
				default_payment_method: req.body.id,
			},
		});
		return res.status(200).json({ message: "Card changes were successful." });
	} catch (e: any) {
		console.error(
			`Failed to change default payment method for customer ${customer.id} (discord id: ${
				req.query.userId
			}) for reason: ${e.message.replace(/"/g, "")}`
		);
		return res.status(500).json({ message: "Failed to change default card." });
	}
};

export default withSession(handler);
