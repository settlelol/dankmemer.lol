import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const discount = await req.session.get("discountCode");
	if (!discount) {
		return res.status(410).json({ error: "No active discount code" });
	}

	return res.status(200).json(discount);
};

export default withSession(handler);
