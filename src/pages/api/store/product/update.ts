import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "put")
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});

	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	} else if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	if (!req.query.productId) {
		return res
			.status(400)
			.json({ error: "No product id was provided in the request." });
	}

	if (!req.body) {
		return res.status(400).json({ error: "No body data was provided." });
	} else if (!req.body.primaryTitle && !req.body.primaryBody) {
		return res
			.status(400)
			.json({ error: "Missing required fields in body." });
	}

	const productId = req.query.productId.toString();
	try {
		const db: Db = await dbConnect();
		const stripe: Stripe = stripeConnect();

		await db.collection("products").updateOne(
			{ _id: productId },
			{
				$set: {
					primaryTitle: req.body.primaryTitle.toString(),
					primaryBody: req.body.primaryBody.toString(),
					secondaryTitle: req.body.secondaryTitle.toString(),
					secondaryBody: req.body.secondaryBody.toString(),
				},
			},
			{ upsert: true }
		);

		await stripe.products.update(productId, {
			metadata: {
				lastUpdated: new Date().getTime(),
			},
		});
		return res.status(200).json({
			message: `Product '${productId}' was updated successfully.`,
		});
	} catch (e: any) {
		console.error(e.message.replace(/"/, ""));
		return res.status(500).json({
			error: `Something went wrong while updating the product information '${productId}'`,
			errorMessage: e.message.replace(/"/, ""),
		});
	}
};

export default withSession(handler);
