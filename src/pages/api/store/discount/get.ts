import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) return res.status(401).json({ error: "You are not logged in." });

	return res.status(200).json({ ...(await req.session.get("discountCode")) });
};

export default withSession(handler);
