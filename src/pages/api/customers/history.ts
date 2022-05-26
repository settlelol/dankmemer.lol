import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}
	const db: Db = await dbConnect();
	const purchaseHistory = await db
		.collection("customers")
		.aggregate([
			{
				$match: {
					discordId: req.query.id,
				},
			},
			{
				$lookup: {
					from: "purchases",
					localField: "purchases.id",
					foreignField: "_id",
					as: "data",
				},
			},
			{
				$project: {
					discordId: req.query.id,
					purchases: "$data",
				},
			},
			{
				$unset: ["_id"],
			},
		])
		.toArray();

	const stripe = stripeConnect();
	const paypal = new PayPal();

	return res.status(200).json({ purchases: purchaseHistory });
};

export default withSession(handler);
