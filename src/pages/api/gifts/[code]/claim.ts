import { NextApiResponse } from "next";
import { TIME } from "src/constants";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import { NextIronRequest, withSession } from "../../../../util/session";

interface Gift {
	_id: string;
	code: string;
	from: string;
	to: string;
	redeemed: boolean;
	purchasedAt: number;
	product: GiftProduct;
}

interface GiftProduct {
	id: string;
	price: string;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const giftCode = req.query.code;
	const db = await dbConnect();
	const stripe = stripeConnect();
	const gift = (await db.collection("gifts").findOne({ code: giftCode, to: user.id })) as Gift;

	if (!gift) {
		return res.status(404).json({ message: "No gift with the provided code was found." });
	}

	if (gift.redeemed) {
		return res.status(409).json({ message: "The gift associated with this code has already been redeemed!" });
	}

	if (gift.to !== user.id) {
		return res.status(403).json({ message: "Gift recipient does not match requester's account ID" });
	}

	try {
		const price = (
			await stripe.prices.search({
				query: `metadata['giftProduct']:'${gift.product.id}'`,
			})
		).data[0];

		const expiry =
			new Date().getTime() *
			price.recurring!.interval_count *
			TIME[price.recurring?.interval as keyof typeof TIME];
		await db.collection("gifts").updateOne(
			{ code: giftCode, to: user.id },
			{
				$set: {
					redeemed: true,
					expiresAt: expiry,
				},
			}
		);
		return res.status(200).json({ message: "Gift redeemed successfully." });
	} catch (e: any) {
		console.error(
			`Error while user (${user.id}) attempted to redeem gift (${gift.code}): ${e.message.replace(/"/g, "")}`
		);
		return res.status(500).json({ message: "Unable to redeem gift. Please try again later." });
	}
};

export default withSession(handler);
