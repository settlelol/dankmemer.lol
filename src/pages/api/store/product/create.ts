import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db } from "mongodb";

interface ProductData {
	_id: any; // It is a string but produces a TS error if stated as such.
	included: string;
	additionallyIncluded?: string;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "post") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const productData: ProductData = req.body;
	if (!productData || productData._id || productData.included) {
		return res.status(400).json({ error: "Invalid body." });
	}

	const db: Db = await dbConnect();

	try {
		await db.collection("products").insertOne(productData);

		return res.status(200).json({ message: "Product added successfully." });
	} catch (e) {
		return res.status(500).json({ error: "Product could not be added." });
	}
};

export default withSession(handler);
