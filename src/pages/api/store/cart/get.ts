import { NextApiResponse } from "next";
import { CartItem } from "src/pages/store";
import { NextIronRequest, withSession } from "../../../../util/session";

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

	const cart: CartItem[] | undefined = await req.session.get("cart");
	return res.status(200).json({ cart });
};

export default withSession(handler);
