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

	const db = await dbConnect();
	const dbUser = (await db.collection("users").findOne({ _id: user.id })) as UserData;

	const country =
		req.headers["cf-ipcountry"] ??
		(await axios("https://cloudflare-quic.com/b/headers")).data.headers["Cf-Ipcountry"];
	const requiredAge = STORE_CUSTOM_MIN_AGE[country as keyof typeof STORE_CUSTOM_MIN_AGE] ?? 18;
	const { age } = req.body;

	if (
		dbUser.ageVerification?.verified &&
		dbUser.ageVerification.years >=
			STORE_CUSTOM_MIN_AGE[dbUser.ageVerification.countryVerified as keyof typeof STORE_CUSTOM_MIN_AGE]
	) {
		return res.status(403).json({ message: "You have already verified your age." });
	}

	if (age < requiredAge) {
		try {
			await db.collection("users").updateOne(
				{ _id: user.id },
				{
					$set: {
						ageVerification: {
							verified: true,
							verifiedOn: new Date().getTime(),
							countryVerified: country,
							years: age,
						},
					},
				}
			);
			return res
				.status(406)
				.json({ message: "You must be at least " + requiredAge + " years old to purchase this." });
		} catch {
			return res
				.status(500)
				.json({ message: "Something went wrong while trying to update your age verification record" });
		}
	}

	try {
		await db.collection("users").updateOne(
			{ _id: user.id },
			{
				$set: {
					ageVerification: {
						verified: true,
						verifiedOn: new Date().getTime(),
						countryVerified: country,
						years: age,
					},
				},
			}
		);
		return res.status(200).json({ message: "Age verification completed." });
	} catch {
		return res.status(202).json({
			message:
				"Age verification completed, however, an unsuccessful attempt was made at adding this to the database. This process will be reattempted next request for age verification",
		});
	}
};

export default withSession(handler);
