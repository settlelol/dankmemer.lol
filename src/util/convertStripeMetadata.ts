import Stripe from "stripe";

interface ConvertedMetadata {
	hidden?: boolean | string;
	paypalPlanId?: string;
	purchaseType?: "subscription" | "one-time";
}

export default function convertStripeMetadata(
	metadata: Stripe.Metadata
): ConvertedMetadata {
	let obj = {} as any;
	const keys = Object.keys(metadata);
	keys.map((k: string, i: number) => {
		obj[k] = JSON.parse(`"${Object.values(metadata)[i]}"`);
	});
	return obj;
}
