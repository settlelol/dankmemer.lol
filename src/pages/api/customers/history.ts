import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import { Customer } from "./get";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const _customer = (await db
		.collection("customers")
		.findOne({ discordId: req.query.id })) as Customer;

	const stripe = stripeConnect();
	const paypal = new PayPal();

	return res.status(200).json({ purchases: _customer.purchases });
};

export default withSession(handler);
