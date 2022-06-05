import axios from "axios";
import { APIEmbed, RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import { NextApiResponse } from "next";
import { RefundStatus } from "src/components/dashboard/account/purchases/PurchaseViewer";
import { dbConnect } from "src/util/mongodb";
import PayPal from "src/util/paypal";
import { NextIronRequest, withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { Customer } from "../../index";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	const { gateway, orderId, type, reason, content, subscriptionId } = req.body;

	const db = await dbConnect();
	const customerRecord = (await db.collection("customers").findOne({ discordId: user.id })) as Customer;

	if (!customerRecord) {
		return res.status(400).json({ message: "No purchase history was found for this user." });
	}

	if (!orderId) {
		return res.status(400).json({ message: "No order ID was provided." });
	}

	const stripe = stripeConnect();
	const paypal = new PayPal();
	try {
		if (gateway === "stripe") {
			const invoice = await stripe.invoices.retrieve(orderId);

			if (!invoice) {
				return res.status(400).json({ message: "No order with the provided ID was found." });
			}
		} else if (gateway === "paypal") {
			if (subscriptionId) {
				const subscription = await paypal.subscriptions.get(subscriptionId);

				if (!subscription) {
					return res.status(400).json({ message: "No subscription with the provided ID was found." });
				}
			} else {
				const order = await paypal.orders.retrieve(orderId);

				if (!order) {
					return res.status(400).json({ message: "No order with the provided ID was found." });
				}
			}
		}
	} catch {
		console.error("Unable to find order with provided id:", orderId);
		return res.status(500).json({ message: "Something went wrong while trying to find your order." });
	}

	const stripeCustomer = (await stripe.customers.retrieve(customerRecord._id)) as Stripe.Customer;
	const hasPurchaseWithId = customerRecord.purchases.find((purchase) => purchase.id === orderId);
	if (!hasPurchaseWithId) {
		return res.status(400).json({ message: "No order with the provided ID was found on the requesting user." });
	}

	if (!type || !reason || !content) {
		return res
			.status(400)
			.json({ message: "Missing body elements, ensure that you have provided all required fields." });
	}

	try {
		await db.collection("refunds").insertOne({
			order: orderId,
			gateway,
			purchasedBy: user.id,
			emails: new Set([user.email, stripeCustomer.email]),
			purchaseType: type,
			reason,
			content,
			status: RefundStatus.OPEN_WAITING_FOR_SUPPORT,
		});

		await axios.post(
			process.env.STORE_WEBHOOK!,
			{
				username: "Refund request open",
				content,
				embeds: [
					{
						title: "Refund request",
						color: 16731212,
						description: "It is best to contact users through email to resolve a refund request.",
						fields: [
							{
								name: `Customer`,
								value: `<@!${user.id}> (${user.id})\n> ${stripeCustomer.id}`,
								inline: true,
							},
							{
								name: "Associated email(s)",
								value: Array.from(new Set([user.email, stripeCustomer.email]))
									.map((email) => `• ${email}`)
									.join("\n"),
								inline: true,
							},
							{
								name: "Reason for Refund",
								value: reason.label,
								inline: true,
							},
							{
								name: "Order",
								value: `${orderId}\n(Purchased through: **${gateway}**)`,
								inline: true,
							},
							{
								name: "Order type",
								value: `\`${
									type === "single" ? "One-time (Non-recurring)" : "Subscription (Recurring)"
								}\``,
								inline: true,
							},
							{
								name: "_ _",
								value: "_ _",
								inline: true,
							},
						],
					},
				] as APIEmbed[],
			} as RESTPostAPIWebhookWithTokenJSONBody,
			{
				headers: { "Content-Type": "application/json" },
			}
		);

		return res.status(200).json({ message: "Refund request has been sent." });
	} catch (e) {
		return res
			.status(500)
			.json({ message: "Something went wrong when trying to lodge your request. Please try again later." });
	}
};

export default withSession(handler);
