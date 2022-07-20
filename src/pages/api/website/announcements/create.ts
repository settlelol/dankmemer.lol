import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const db = await dbConnect();
	const redis = await redisConnect();

	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const { content } = req.body;
	if (!content) {
		return res.status(400).json({ message: "Missing announcement content in request body." });
	}

	await redis.del("announcements");

	try {
		await db.collection("announcements").insertOne({
			content: content || "",
			createdAt: new Date().getTime(),
			author: user.id,
		});
		return res.status(200).json({});
	} catch (e) {
		return res.status(500).json({ error: e });
	}
};

export default withSession(handler);
