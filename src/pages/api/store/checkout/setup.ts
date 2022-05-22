import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../../util/session";
import { dbConnect } from "src/util/mongodb";
import { Db, ObjectId } from "mongodb";
import { CartItem } from "src/pages/store";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { AppliedDiscount } from "../discount/apply";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const stripe = stripeConnect();
	const db: Db = await dbConnect();

	const user = await req.session.get("user");
	if (!user) {
		return res.status(401).json({ error: "You are not logged in." });
	}

	const cart: CartItem[] | undefined = await req.session.get("cart");
	if (!cart) {
		return res
			.status(400)
			.json({ error: "You must have items in your cart." });
	}

	const _customer = await db
		.collection("customers")
		.findOne({ discordId: user.id });

	let customer;
	if (_customer) {
		customer = await stripe.customers.retrieve(_customer._id);
	} else if (!_customer) {
		try {
			customer = await stripe.customers.create({
				email: user.email,
				metadata: {
					discordId: user.id,
				},
			});
			db.collection("customers").insertOne({
				_id: customer.id as unknown as ObjectId,
				discordId: user.id,
				purchases: [],
			});
		} catch (e: any) {
			console.error(
				`Error while creating Stripe customer: ${e.message.split(
					/"/g,
					""
				)}`
			);
			return res
				.status(500)
				.json({ error: "Unable to create new customer" });
		}
	}

	let discount: Stripe.PromotionCode | null = null;
	let discountCode: AppliedDiscount | undefined = await req.session.get(
		"discountCode"
	);

	if (discountCode) {
		let promotionalCode = await stripe.promotionCodes.list({
			code: discountCode?.code,
			active: true,
		});

		discount = promotionalCode.data[0];
	}

	try {
		if (cart.length === 1 && cart[0].metadata?.type === "subscription") {
			const subscription = await stripe.subscriptions.create({
				customer: customer?.id!,
				payment_behavior: "default_incomplete",
				expand: ["latest_invoice.payment_intent"],
				...(discount && { coupon: discount.coupon.id }),
				items: [{ price: cart[0].selectedPrice.id }],
			});

			return res.status(200).json({
				client_secret:
					// @ts-ignore
					subscription.latest_invoice?.payment_intent?.client_secret,
				// @ts-ignore
				invoice: subscription.latest_invoice?.id,
				subscription: subscription.id,
			});
		}

		for (let i = 0; i < cart.length; i++) {
			await stripe.invoiceItems.create({
				customer: customer?.id!,
				currency: "usd",
				price: cart[i].selectedPrice.id,
				quantity: cart[i].quantity,
			});
		}

		/**
		 * Add Sales tax to the Stripe total. The 10% discount for orders >= $20
		 * is calculated later here.
		 */
		await stripe.invoiceItems.create({
			customer: customer?.id!,
			currency: "usd",
			unit_amount_decimal: (
				cart.reduce(
					(acc: number, item: CartItem) =>
						acc + (item.selectedPrice.price / 100) * item.quantity,
					0
				) *
				0.0675 *
				100
			).toFixed(0),
		});

		const pendingInvoice = await stripe.invoices.create({
			customer: customer?.id!,
			auto_advance: true,
			collection_method: "charge_automatically",
			metadata: {
				boughtByDiscordId: user.id,
			},
		});

		let discounts: Stripe.InvoiceUpdateParams.Discount[] = [];
		if (discountCode && discount) {
			discounts.push({ coupon: discount.coupon.id });
		}
		if (pendingInvoice.total >= 20) {
			discounts.push({ coupon: "THRESHOLD" });
		}

		await stripe.invoices.update(pendingInvoice.id, {
			discounts,
		});

		const finalizedInvoice = await stripe.invoices.finalizeInvoice(
			pendingInvoice.id
		);
		const paymentIntent = await stripe.paymentIntents.update(
			// @ts-ignore
			finalizedInvoice.payment_intent?.toString(),
			{
				description: `Payment for ${cart
					.map((item) => `${item.quantity}x ${item.name}`)
					.join(", ")}`,
			}
		);

		return res.status(200).json({
			client_secret: paymentIntent.client_secret,
			invoice: finalizedInvoice.id,
		});
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res
			.status(500)
			.json({ error: "Error while creating Stripe Invoice." });
	}
};

export default withSession(handler);
