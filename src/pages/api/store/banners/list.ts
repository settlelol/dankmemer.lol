import { NextApiResponse } from "next-auth/internals/utils";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ message: "You need to be logged in." });
	}

	let query = {};
	if (!user.developer) {
		query = {
			active: true,
		};
	}

	const db = await dbConnect();
	const banners = await db.collection("store-banners").find(query).toArray();
	if (!banners) {
		return res.status(501).json({ message: "There is no existing banners in the database." });
	}

	return res.status(200).json(banners);
};
export default withSession(handler);
