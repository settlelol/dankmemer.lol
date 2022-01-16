import Stripe from "stripe";

let key: string | undefined =
	process.env.NODE_ENV === "production"
		? process.env.STRIPE_SECRET_LIVE_KEY
		: process.env.STRIPE_SECRET_TEST_KEY;

let _stripe: Stripe;

if (!key) {
	throw new Error(
		`Please define the ${
			process.env.NODE_ENV === "production"
				? "STRIPE_SECRET_LIVE_KEY"
				: "STRIPE_SECRET_TEST_KEY"
		} environment variable inside .env`
	);
}

export function stripeConnect() {
	if (_stripe) return _stripe;
	const stripe: Stripe = new Stripe(key!, {
		apiVersion: "2020-08-27",
		typescript: true,
	});
	_stripe = stripe;
	return stripe;
}
