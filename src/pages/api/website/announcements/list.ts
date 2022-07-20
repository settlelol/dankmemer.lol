import { NextApiResponse } from "next";
import { TIME } from "src/constants";
import { Announcement } from "src/pages/control/website/announcements";
import { UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { redisConnect } from "src/util/redis";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const db = await dbConnect();
	const redis = await redisConnect();

	const cached = await redis.get("announcements");

	if (cached) {
		return res.json(JSON.parse(cached));
	}

	try {
		let announcements = (
			await db.collection("announcements").find({}).sort({ createdAt: -1 }).toArray()
		).shift() as Announcement[];

		if (!announcements[0] || announcements[0].content === "") {
			return res.status(200).json({});
		}

		for (let announcement of announcements) {
			const author = (await db.collection("users").findOne({ _id: announcement.author })) as UserData;
			announcement.author = `${author.name}#${author.discriminator}`;
		}

		await redis.set("announcements", JSON.stringify(announcements), "PX", TIME.day);

		return res.status(200).json(announcements);
	} catch (e) {
		return res.status(500).json({ error: e });
	}
};

export default withSession(handler);
