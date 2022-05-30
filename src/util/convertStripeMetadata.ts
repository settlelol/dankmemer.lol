import Stripe from "stripe";

interface ConvertedMetadata {
	hidden?: boolean | string;
	paypalPlan?: string;
	type?: "subscription" | "one-time";
}

export default function convertStripeMetadata(metadata: Stripe.Metadata): ConvertedMetadata {
	let obj: Partial<ConvertedMetadata> = {};
	const keys = Object.keys(metadata);
	keys.map((k: string, i: number) => {
		obj[k as keyof ConvertedMetadata] = JSON.parse(`"${Object.values(metadata)[i]}"`);
	});
	return obj;
}
