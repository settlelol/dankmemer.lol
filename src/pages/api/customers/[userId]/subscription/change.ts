import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "src/util/session";
import { Customer } from "..";
import { DetailedPrice } from "src/pages/api/store/product/details";
import PayPal from "src/util/paypal";

export interface SubscriptionInformation {
	id: string;
	product: SubscriptionProduct;
	currentPeriod: CurrentPeriod;
}

interface SubscriptionProduct {
	id: string;
	name: string;
	image: string;
	price: Required<Omit<DetailedPrice, "id">>;
}

interface CurrentPeriod {
	start: number;
	end: number;
}

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	if (req.method?.toLowerCase() !== "patch") {
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

	const { newProduct, newPrice } = req.body;
	if (!newProduct || !newPrice) {
		return res.status(400).json({ message: "Both body elements are required." });
	}

	const db: Db = await dbConnect();
	const _customer = (await db.collection("customers").findOne({ discordId: req.query.userId })) as Customer;
	if (!_customer.subscription) {
		return res.status(400).json({ message: "no sub" });
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

		try {
			const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
				proration_behavior: "create_prorations",
				billing_cycle_anchor: "now",
				items: [
					{
						id: subscription.items.data[0].id,
						deleted: true,
					},
					{
						plan: newPrice,
					},
				],
			});
			if (updatedSubscription.status === "incomplete") {
				return res.status(422).json({
					message:
						"Default payment method was declined during subscription change. You may try again or change your default payment method.",
				});
			} else {
				return res.status(200).json({ message: "Subscription has been changed." });
			}
		} catch (e: any) {
			console.error(`Failed to cancel subscription for user ${user.id}, reason: ${e.message.replace(/"/g, "")}`);
			return res.status(500).json({ message: "Failed to change subscription." });
		}
	} else if (_customer.subscription.provider === "paypal") {
		try {
			// Do to limitations with the PayPal API we need to keep
			// track of subscription dates manually. However, to avoid
			// charging the user again we cancel the subscription here
			// and remove their benefits at the end of the period which
			// is indicated by their customer record in db.
			// const paypal = new PayPal();
			// const subscription = await paypal.subscriptions.get(_customer.subscription.id);

			// if (!subscription) {
			// 	return res.status(410).json({
			// 		message: "No subscription was found",
			// 		isSubscribed: false,
			// 	});
			// }

			// Promise.all([
			// 	paypal.subscriptions.cancel(subscription.id),
			// 	db.collection("customers").updateOne(
			// 		{ _id: _customer._id },
			// 		{
			// 			$set: {
			// 				"subscription.cancelled": true,
			// 			},
			// 		}
			// 	),
			// ]);
			return res.status(200).json({ message: "PayPal change not done yet." });
		} catch (e: any) {
			console.error(
				`Failed to cancel PayPal subscription for user ${user.id}, reason: ${e.message.replace(/"/g, "")}`
			);
			return res.status(500).json({ message: "Failed to cancel subscription renewal." });
		}
	}
};

export default withSession(handler);
