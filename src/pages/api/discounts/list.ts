import { NextApiResponse } from "next";
import { NextIronRequest, withSession } from "../../../util/session";
import { stripeConnect } from "src/util/stripe";
import { Discount } from "src/pages/control/store/discounts";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");

	if (!user) {
		return res.status(403).json({ message: "You are unauthorized" });
	}

	if (!user.developer) {
		return res.status(401).json({ error: "You can't do this." });
	}

	const stripe = stripeConnect();
	const discounts = (await stripe.coupons.list()).data;

	const result: Discount[] = [];
	for (let discount of discounts) {
		const promotion = (await stripe.promotionCodes.list({ coupon: discount.id })).data[0];

		result.push({
			id: discount.id,
			name: discount.name!,
			code: promotion ? promotion.code : null,
			created: discount.created,
			discountAmount: {
				percent: discount.percent_off,
				dollars: discount.amount_off,
			},
			duration: {
				label: discount.duration,
				months: discount.duration_in_months,
			},
			expires: discount.redeem_by,
			redemptions: discount.times_redeemed,
		});
	}

	return res.status(200).json(result);
};

export default withSession(handler);
