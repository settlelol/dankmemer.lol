import { Db } from "mongodb";
import { NextApiResponse } from "next";
import { dbConnect } from "src/util/mongodb";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "src/util/session";
import { Customer } from "..";
import { PriceObject } from "../history";
import { DetailedPrice } from "src/pages/api/store/product/details";

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
		await stripe.subscriptions.update(subscription.id, {
			cancel_at_period_end: true,
		});
		return res.status(200).json({ message: "Subscription renewal has been cancelled." });
	} catch (e: any) {
		console.error(`Failed to cancel subscription for user ${user.id}, reason: ${e.message.replace(/"/g, "")}`);
		return res.status(500).json({ message: "Failed to cancel subscription renewal." });
	}
};

export default withSession(handler);
