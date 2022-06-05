import { NextApiResponse } from "next";
import { Refund, RefundStatus } from "src/components/dashboard/account/purchases/PurchaseViewer";
import { dbConnect } from "src/util/mongodb";
import { NextIronRequest, withSession } from "src/util/session";

const handler = async (req: NextIronRequest, res: NextApiResponse) => {
	const user = await req.session.get("user");
	if (!user) {
		return res.status(403).json({ message: "You are unauthorized." });
	}

	const db = await dbConnect();
	const refund = (await db.collection("refunds").findOne({ order: req.query.userId })) as Refund;

	if (!refund) {
		return res.status(202).json({ message: "No refund was found for the given ID." });
	}

	if (refund.status === RefundStatus.CLOSED_WON || refund.status === RefundStatus.CLOSED_LOSS) {
		return res.status(202).json({ message: "A refund case has been closed relating to this product." });
	}

	return res.status(200).json({
		status: refund.status,
	});
};

export default withSession(handler);
