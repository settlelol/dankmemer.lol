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

	const cart = await req.session.get("cart");
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

	const totalValue = cart
		.map(
			(item: CartItem) =>
				(item.price.type === "recurring"
					? item.price.interval === "year"
						? item.unit_cost * 10.8
						: item.unit_cost
					: item.unit_cost) * item.quantity
		)
		.reduce((a: number, b: number) => a + b)
		.toFixed(2);

	try {
		const pi = await stripe.paymentIntents.create({
			amount: Math.ceil(parseFloat(totalValue) * 100),
			currency: "usd",
			receipt_email: user.email,
			customer: customer?.id,
			automatic_payment_methods: { enabled: true },
		});
		return res
			.status(200)
			.json({ client_secret: pi.client_secret, payment_intent: pi.id });
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res
			.status(500)
			.json({ error: "Error while creating Stripe PaymentIntent." });
	}
};

export default withSession(handler);
