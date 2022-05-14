import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db } from "mongodb";
import { ProductPrice } from "src/components/control/store/ProductCreator";
import { stripeConnect } from "src/util/stripe";
import { createPayPal } from "src/util/paypal/PayPalEndpoint";
import PayPal from "src/util/paypal";
import { ObjectID } from "bson";
import { ProductCreateResponse } from "src/util/paypal/classes/Products";
import Stripe from "stripe";
import { redisConnect } from "src/util/redis";

interface ProductData {
	name: string;
	type: "single" | "recurring";
	prices: ProductPrice[];
	description?: string; // Invoice descriptions
	primaryTitle: string;
	primaryBody: string;
	secondaryTitle?: string;
	secondaryBody?: string;
}

enum ProductIntervals {
	"Daily" = "day",
	"Weekly" = "week",
	"Monthly" = "month",
	"Annually" = "year",
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
	if (!productData) {
		return res.status(400).json({ error: "Invalid body." });
	}

	try {
		// TODO:(InBlue) create a way for images to be uploaded when creating a product.
		const db: Db = await dbConnect();
		const stripe = stripeConnect();
		const paypal = new PayPal();
		const redis = await redisConnect();

		let paypalProduct: ProductCreateResponse;

		const stripeProduct = await stripe.products.create({
			name: productData.name,
			active: true,
			tax_code: "txcd_10000000", // General - Electronically Supplied Services
			...(productData.description &&
				productData.description.length >= 1 && {
					description: productData.description,
				}),
			metadata: {
				hidden: "true",
			},
		});

		try {
			paypalProduct = await paypal.products.create({
				name: productData.name,
				type: "DIGITAL",
				...(productData.description &&
					productData.description.length >= 1 && {
						description: productData.description,
					}),
			});
		} catch (e: any) {
			return res.status(500).json({
				message: "Unable to create product on PayPal",
				error: e.message,
			});
		}

		if (productData.type === "single") {
			// Change provided price to cents
			const priceInCents = parseInt(
				(
					parseFloat(
						productData.prices[0].value as unknown as string
					) * 100
				).toString()
			);
			await stripe.prices.create({
				currency: "USD",
				product: stripeProduct.id,
				unit_amount: priceInCents,
				tax_behavior: "exclusive",
			});
			await redis.del("store:products:one-time");
		} else if (productData.type === "recurring") {
			for (let i = 0; i < productData.prices.length; i++) {
				// Change provided price to cents
				const priceInCents = parseInt(
					(
						parseFloat(
							productData.prices[i].value as unknown as string
						) * 100
					).toString()
				);

				try {
					const plan = await paypal.plans.create({
						product_id: paypalProduct.id!,
						name: productData.name,
						status: "ACTIVE",
						...(productData.description &&
							productData.description.length >= 1 && {
								description: productData.description,
							}),
						billing_cycles: [
							{
								frequency: {
									interval_unit: ProductIntervals[
										productData.prices[i].interval!
									].toUpperCase() as
										| "DAY"
										| "WEEK"
										| "MONTH"
										| "YEAR",
									interval_count: parseInt(
										productData.prices[i].intervalCount!
									),
								},
								tenure_type: "REGULAR",
								sequence: 1,
								pricing_scheme: {
									fixed_price: {
										value: productData.prices[
											i
										].value.toString(),
										currency_code: "USD",
									},
								},
							},
						],
						payment_preferences: {
							auto_bill_outstanding: true,
							payment_failure_threshold: 3,
							setup_fee_failure_action: "CONTINUE",
						},
					});

					await stripe.prices.create({
						currency: "USD",
						product: stripeProduct.id,
						unit_amount: priceInCents,
						tax_behavior: "exclusive",
						recurring: {
							interval:
								ProductIntervals[
									productData.prices[i].interval!
								],
							interval_count:
								parseInt(
									productData.prices[i].intervalCount!
								) || 1,
						},
						metadata: {
							paypalPlan: plan.id,
						},
					});
				} catch (e: any) {
					return res.status(500).json({
						message: "Unable to create subscription plan on PayPal",
						error: e.message,
					});
				}
			}
			await redis.del("store:products:subscriptions");
		}

		// Add store modal data to database
		await db.collection("products").insertOne({
			_id: stripeProduct.id as unknown as ObjectID,
			primaryTitle: productData.primaryTitle,
			primaryBody: productData.primaryBody,
			secondaryTitle: productData.secondaryTitle || "",
			secondaryBody: productData.secondaryBody || "",
		});

		return res.status(200).json({
			message: "Product added successfully.",
			product: stripeProduct.id,
		});
	} catch (e: any) {
		return res
			.status(500)
			.json({ message: "Product could not be added.", error: e.message });
	}
};

export default withSession(handler);
