import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db } from "mongodb";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const db: Db = await dbConnect();
	const productId: string = req.query?.id.toString();
	if (!productId) {
		return res.status(400).json({ error: "No product id given." });
	}

	const product = await db.collection("products").findOne({ _id: productId });
	if (!product)
		return res
			.status(404)
			.json({ error: "Product with given id was not found." });

	return res.status(200).json(product);
};

export default withSession(handler);
