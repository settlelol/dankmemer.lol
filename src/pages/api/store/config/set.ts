import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are not authorized." });
	}

	const { isGift, giftFor } = req.body;
	try {
		req.session.set("store-config", {
			isGift,
			giftFor,
		});
		await req.session.save();
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({ message: "Failed to set configuration" });
	} finally {
		return res.status(200).json({ message: "Configuration set." });
	}
};

export default withSession(handler);
