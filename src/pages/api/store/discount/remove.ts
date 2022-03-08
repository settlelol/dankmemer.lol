import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const activeDiscount = await req.session.get("discountCode");
	if (!activeDiscount)
		return res
			.status(400)
			.json({ error: "You do not have an active discount code." });

	req.session.unset("discountCode");
	await req.session.save();

	return res.status(200).json({ message: "Discount code removed." });
};

export default withSession(handler);
