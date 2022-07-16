import { NextApiResponse } from "next";
import { StaticResource } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

export interface StoreProductCategory {
	id: string;
	name: string;
	author: string;
	createdAt: number;
	updatedAt: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const db = await dbConnect();
	const categories = (await db
		.collection("static")
		.findOne({ label: "store-categories" })) as StaticResource<StoreProductCategory>;

	return res.status(200).json(categories?.content ?? []);
};

export default withSession(handler);
