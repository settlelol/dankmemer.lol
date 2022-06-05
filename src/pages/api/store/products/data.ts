import { NextApiResponse } from "next";
import { ProductData, ProductSales } from "src/pages/control/store/products";
import { Metadata } from "src/pages/store";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const db = await dbConnect();
	const user = req.session.get("user");

	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const result: Partial<ProductData>[] = [];
	const stripe = stripeConnect();
	const productSales = (await db
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
		.toArray()) as unknown as ProductSales[];

	const { data: products } = await stripe.products.list({
		active: true,
		limit: 100,
	});

	for (let product of products) {
		if ((product.metadata as Metadata).type !== "giftable") {
			const salesData = productSales.find((ps) => ps._id === product.id);
			const pricesRaw = (
				await stripe.prices.list({
					product: product.id,
					active: true,
				})
			).data;
			const prices = [];
			let activeSubscriptions = 0;

			for (let price of pricesRaw) {
				prices.push({
					value: price.unit_amount!,
				});
				if (price.recurring) {
					activeSubscriptions += (
						await stripe.subscriptions.list({
							price: price.id,
						})
					).data.length;
				}
			}

			const purchase: Partial<ProductData> = {
				id: product.id,
				name: product.name,
				image: product.images[0],
				prices,
				activeSubscriptions,
				type: pricesRaw[0].type,
				lastUpdated: product.updated,
				totalSales: salesData ? salesData.sales : 0,
				totalRevenue: salesData ? salesData.revenue : 0,
			};
			result.push(purchase);
		}
	}

	return res.status(200).json(result);
};

export default withSession(handler);
