import { NextApiResponse } from "next";
import { StaticResource } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { StoreProductCategory } from "./list";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	if (!user.developer) {
		return res.status(403).json({ message: "You do not have permission to perform this action." });
	}

	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ message: "Missing name for category creation!" });
	}

	const db = await dbConnect();

	try {
		const categories = (await db.collection("static").findOne({ label: "store-categories" })) as StaticResource<
			StoreProductCategory[]
		>;

		if (categories?.content.find((category) => category.name === name)) {
			return res.status(400).json({ message: "A category with that name already exists!" });
		}

		// Create a new random ID for the category
		let newCategoryId = Math.random().toString(36).substring(2, 15);
		while (categories?.content.filter((category) => category.id === newCategoryId).length >= 1) {
			newCategoryId = Math.random().toString(36).substring(2, 15);
		}

		const category = {
			id: newCategoryId,
			name,
			author: user.id,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await db.collection("static").updateOne(
			{ label: "store-categories" },
			{
				$push: {
					content: category,
				},
			},
			{ upsert: true }
		);

		return res.status(200).json({ message: "Category created!", category });
	} catch (e: any) {
		console.error(`Error while trying to create category '${name}': ${e.message.replace(/"/g, "")}`);
		return res.status(500).json({ message: "Internal server error!" });
	}
};

export default withSession(handler);
