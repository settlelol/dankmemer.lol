import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const db = await dbConnect();
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const productSales = await db
		.collection("purchases")
		.aggregate([
			{ $unwind: "$items" },
			{
				$project: {
					product: "$items.id",
					totalSales: {
						$sum: "$items.quantity",
					},
					grossRevenue: {
						$multiply: ["$items.quantity", "$items.price"],
					},
				},
			},
			{
				$group: {
					_id: "$product",
					sales: { $sum: "$totalSales" },
					revenue: { $sum: "$grossRevenue" },
				},
			},
		])
		.toArray();

	return res.status(200).json({ productSales });
};

export default withSession(handler);
