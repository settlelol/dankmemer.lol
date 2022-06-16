import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "src/util/session";
import { Customer } from "..";
import { PriceObject } from "../history";
import { DetailedPrice } from "src/pages/api/store/product/details";
import PayPal from "src/util/paypal";

export interface SubscriptionInformation {
	id: string;
	product: SubscriptionProduct;
	finalPeriod: boolean;
	currentPeriod: CurrentPeriod;
}

interface SubscriptionProduct {
	id: string;
	name: string;
	image: string;
	price: Required<DetailedPrice>;
}

interface CurrentPeriod {
	start: number;
	end: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "get") {
		return res.status(405).json({
			error: `Method '${req.method?.toUpperCase()}' cannot be used on this endpoint.`,
		});
	}

	const user = req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	if (user && req.query.userId !== user.id) {
		return res.status(403).json({ error: "You are unauthorized to view this data." });
	}

	const db: Db = await dbConnect();
	const _customer = (await db.collection("customers").findOne({ discordId: req.query.userId })) as Customer;

	if (!_customer.subscription) {
		return res.status(410).json({ message: "No active subscription was found for this user." });
	}

	if (_customer.subscription.provider === "stripe") {
		const stripe = stripeConnect();
		let customer: Stripe.Customer | undefined;
		if (!_customer) {
			const unrecordedCustomer = (
				await stripe.customers.search({
					query: `metadata['discordId']: '${user.id}' OR email:'${user.email}'`,
				})
			).data[0];

			if (unrecordedCustomer) {
				customer = unrecordedCustomer;
			} else {
				return res.status(404).json({
					error: "Requested user was not found in the database.",
				});
			}
		} else {
			customer = (await stripe.customers.retrieve(_customer._id, {
				expand: ["invoice_settings.default_payment_method"],
			})) as Stripe.Customer;
		}

		const subscription = (
			await stripe.subscriptions.list({
				customer: customer.id,
				status: "active",
			})
		).data[0];

		if (!subscription) {
			return res.status(410).json({
				message: "No subscription was found",
				isSubscribed: false,
			});
		}

		const subscriptionProduct = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
		const subscriptionPrice = subscription.items.data[0].price;
		return res.status(200).json({
			message: "A subscription has been found",
			isSubscribed: true,
			subscription: {
				id: subscription.id,
				product: {
					id: subscriptionProduct.id,
					name: subscriptionProduct.name,
					image: subscriptionProduct.images[0],
					price: {
						value: subscriptionPrice.unit_amount!,
						interval: {
							period: subscriptionPrice.recurring!.interval,
							count: subscriptionPrice.recurring!.interval_count,
						},
					},
				},
				finalPeriod: subscription.cancel_at_period_end,
				currentPeriod: {
					start: subscription.current_period_start,
					end: subscription.current_period_end,
				},
			} as SubscriptionInformation,
		});
	} else if (_customer.subscription.provider === "paypal") {
		try {
			const paypal = new PayPal();
			const stripe = stripeConnect();
			const subscription = await paypal.subscriptions.get(_customer.subscription.id);

			if (!subscription) {
				return res.status(410).json({
					message: "No subscription was found",
					isSubscribed: false,
				});
			}

			const plan = await paypal.plans.retrieve(subscription.plan_id);
			const stripeProduct = await stripe.products.retrieve(plan.product_id);
			const stripePrice = (
				await stripe.prices.list({
					product: stripeProduct.id,
					active: true,
				})
			).data.find(
				(price) =>
					(price.unit_amount! / 100).toString() === plan.billing_cycles[0].pricing_scheme?.fixed_price?.value
			)!;
			return res.status(200).json({
				message: "A subscription has been found",
				isSubscribed: true,
				subscription: {
					id: subscription.id,
					product: {
						id: stripeProduct.id,
						name: stripeProduct.name,
						image: stripeProduct.images[0],
						price: {
							id: stripePrice.id,
							value: stripePrice.unit_amount!,
							interval: {
								period: stripePrice.recurring!.interval,
								count: stripePrice.recurring!.interval_count,
							},
						},
					},
					finalPeriod: _customer.subscription.cancelled,
					currentPeriod: {
						start: _customer.subscription.purchaseTime,
						// Divide by 1000 because Stripe dates are in seconds and PayPal uses ms,
						// there already exists a conversion between the two on the frontend.
						end: _customer.subscription.expiryTime / 1000,
					},
				} as SubscriptionInformation,
			});
		} catch (e: any) {
			console.error(e);
			return res.status(500).send(false);
		}
	}
};

export default withSession(handler);
