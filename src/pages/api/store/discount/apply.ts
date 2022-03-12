import { NextApiResponse } from "next";
import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { NextIronRequest, withSession } from "../../../../util/session";

export interface AppliedDiscount {
	code: string;
	discountedItems: DiscountItem[];
	totalSavings: number;
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

	const code = req.query.code.toString();
	if (!code) {
		return res
			.status(401)
			.json({ error: "No discount code was provided." });
	}

	const stripe = stripeConnect();
	let promotionalCodes;
	try {
		const { data: _codes } = await stripe.promotionCodes.list({
			code,
			expand: ["data.coupon.applies_to"],
		});
		promotionalCodes = _codes;
	} catch (e: any) {
		console.error(e.message.replace(/"/g, ""));
		return res.status(500).json({
			error: "Unable to retrieve promotional codes from Stripe.",
		});
	}

	if (promotionalCodes.length < 1) {
		return res.status(404).json({
			error: "No discount code that matched the input was found.",
		});
	}

	const promotionalCode = promotionalCodes[0];

	if (!promotionalCode.id) {
		return res.status(404).json({
			error: "No discount code that matched the input was found.",
		});
	}

	if (!promotionalCode.active) {
		return res.status(410).json({
			message: "The code has been found, however it has already expired.",
		});
	}

	if (
		!(
			promotionalCode.times_redeemed <=
			(promotionalCode.max_redemptions ?? 0)
		)
	) {
		return res.status(410).json({
			message: "The code has reached its maximum redemptions.",
		});
	}

	const coupon: Stripe.Coupon = promotionalCode.coupon;
	const cart: CartItem[] = await req.session.get("cart")!;
	const cartTotal = cart.reduce(
		(acc, item: CartItem) =>
			acc + (item.selectedPrice.price / 100) * item.quantity,
		0
	);

	if ((promotionalCode.restrictions.minimum_amount ?? 0) / 100 > cartTotal) {
		return res.status(403).json({
			error: `The code can only be used when the cart contents are above $${promotionalCode.restrictions.minimum_amount}`,
		});
	}

	const discountAmount = coupon.percent_off! / 100;
	const discountedItems: DiscountItem[] = [];
	const appliesTo: string[] | undefined = coupon.applies_to?.products;
	let totalSavings = 0;

	if (appliesTo && appliesTo.length >= 1) {
		for (let i in appliesTo) {
			const { data: priceForProduct } = await stripe.prices.list({
				product: appliesTo[i],
			});
			const itemInCart = cart.filter(
				(item) => item.id === appliesTo[i]
			)[0];

			if (!itemInCart) break;

			const itemCost =
				(itemInCart.selectedPrice.interval === "year"
					? itemInCart.unit_cost * 10.8 // 10.8 is just 12 months (x12) with a 10% discount
					: itemInCart.unit_cost) * itemInCart.quantity;
			const result: DiscountItem = {
				id: appliesTo[i],
				type: priceForProduct[0].type,
				originalCost: itemCost,
				discountedCost: parseFloat(
					(itemCost - itemCost * discountAmount).toFixed(2)
				),
				savings: parseFloat((itemCost * discountAmount).toFixed(2)),
			};
			discountedItems.push(result);
			totalSavings += parseFloat((itemCost * discountAmount).toFixed(2));
		}
	} else {
		for (let i = 0; i < cart.length; i++) {
			const { data: priceForProduct } = await stripe.prices.list({
				product: cart[i].id,
			});
			const itemCost =
				(cart[i].selectedPrice.interval === "year"
					? cart[i].unit_cost * 10.8 // 10.8 is just 12 months (x12) with a 10% discount
					: cart[i].unit_cost) * cart[i].quantity;
			const result: DiscountItem = {
				id: cart[i].id,
				type: priceForProduct[0].type,
				originalCost: itemCost,
				discountedCost: parseFloat(
					(itemCost - itemCost * discountAmount).toFixed(2)
				),
				savings: parseFloat((itemCost * discountAmount).toFixed(2)),
			};
			discountedItems.push(result);
			totalSavings += parseFloat((itemCost * discountAmount).toFixed(2));
		}
	}

	if (discountedItems.length < 1) {
		return res.status(406).json({ code });
	}

	req.session.set("discountCode", { code, discountedItems, totalSavings });
	await req.session.save();

	return res.status(200).json({ code, discountedItems, totalSavings });
};

export default withSession(handler);
