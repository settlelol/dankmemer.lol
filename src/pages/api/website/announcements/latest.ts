import { NextApiResponse } from "next";
import { TIME } from "src/constants";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const db = await dbConnect();
	const redis = await redisConnect();

	const cached = await redis.get("announcements:latest");

	if (cached) {
		return res.json(JSON.parse(cached));
	}

	try {
		const announcements = await db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray();

		if (!announcements[0] || announcements[0].content === "") {
			return res.status(200).json({});
		}

		const announcement = announcements.map(({ _id, author, ...announcements }) => announcements)[0];

		await redis.set("announcements:latest", JSON.stringify(announcement), "PX", TIME.day);

		return res.status(200).json(announcement);
	} catch (e) {
		return res.status(500).json({ error: e });
	}
};

export default withSession(handler);
