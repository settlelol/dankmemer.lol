import axios from "axios";
import { NextApiResponse } from "next";
import { STORE_CUSTOM_MIN_AGE } from "src/constants";
import { UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.moderator) {
		return res.status(403).json({ error: "You do not have permission to perform this action." });
	}

	const { for: resetUserId } = req.query;

	if (!resetUserId) {
		return res.status(400).json({ error: "Missing user id" });
	}

	const db = await dbConnect();
	const dbUser = (await db.collection("users").findOne({ _id: resetUserId })) as UserData;

	if (!dbUser) {
		return res.status(404).json({ error: "User not found" });
	}

	try {
		await db.collection("users").updateOne(
			{ _id: resetUserId },
			{
				$set: {
					ageVerification: {
						verified: false,
						verifiedOn: null,
						countryVerified: null,
						years: null,
					},
				},
			}
		);
		return res.status(200).json({ message: "User age verification reset" });
	} catch {
		return res
			.status(500)
			.json({ message: "Something went wrong while trying to reset the user age verification." });
	}
};

export default withSession(handler);
