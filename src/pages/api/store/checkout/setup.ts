import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db, ObjectId } from "mongodb";
import { CartItem } from "src/pages/store";
import { stripeConnect } from "src/util/stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const stripe = stripeConnect();
	const db: Db = await dbConnect();

	const user = await req.session.get("user");
	if (!user) return res.status(401).json({ error: "You are not logged in." });

	const cart: CartItem[] | undefined = await req.session.get("cart");
	if (!cart)
		return res
			.status(400)
			.json({ error: "You must have items in your cart." });

	const _customer = await db
		.collection("customers")
		.findOne({ discordId: user.id });

	let customer;
	if (_customer) customer = await stripe.customers.retrieve(_customer._id);
	else if (!_customer) {
		try {
			customer = await stripe.customers.create({
				email: user.email,
				metadata: {
					discordId: user.id,
				},
			});
			db.collection("customers").insertOne({
				_id: customer.id as unknown as ObjectId,
				discordId: user.id,
				purchases: [],
			});
		} catch (e: any) {
			console.error(
				`Error while creating Stripe customer: ${e.message.split(
					/"/g,
					""
				)}`
			);
			return res
				.status(500)
				.json({ error: "Unable to create new customer" });
		}
	}

	// Add discounts to shopping cart page so that they can be added to the invoice here.

	try {
		if (cart.length === 1 && cart[0].metadata?.type === "membership") {
			const subscription = await stripe.subscriptions.create({
				customer: customer?.id!,
				payment_behavior: "default_incomplete",
				expand: ["latest_invoice.payment_intent"],
				items: [{ price: cart[0].selectedPrice.id }],
			});

			return res.status(200).json({
				client_secret:
					// @ts-ignore
					subscription.latest_invoice?.payment_intent?.client_secret,
				// @ts-ignore
				payment_intent: subscription.latest_invoice?.payment_intent?.id,
				subscription: subscription.id,
			});
		}

		for (let i = 0; i < cart.length; i++) {
			await stripe.invoiceItems.create({
				customer: customer?.id!,
				currency: "usd",
				price: cart[i].selectedPrice.id,
				quantity: cart[i].quantity,
			});
		}

		const pendingInvoice = await stripe.invoices.create({
			customer: customer?.id!,
			auto_advance: true,
			collection_method: "charge_automatically",
		});

		const finalizedInvoice = await stripe.invoices.finalizeInvoice(
			pendingInvoice.id
		);
		const paymentIntent = await stripe.paymentIntents.retrieve(
			// @ts-ignore
			finalizedInvoice.payment_intent?.toString()
		);

		return res.status(200).json({
			client_secret: paymentIntent.client_secret,
			payment_intent: paymentIntent.id,
		});
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res
			.status(500)
			.json({ error: "Error while creating Stripe Invoice." });
	}
};

export default withSession(handler);
