import Products from "./classes/Products";
import Webhooks from "./classes/Webhooks";
import Simulations from "./classes/Simulations";

if (!process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_SECRET) {
	throw new Error(
		`Please define the PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables inside .env`
	);
}

export enum AllowedMethods {
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"HEAD",
	"CONNECT",
	"OPTIONS",
	"PATCH",
}

export default class PayPal {
	products: Products;
	webhooks: Webhooks;
	simulate: Simulations;

	constructor() {
		this.products = new Products();
		this.webhooks = new Webhooks();
		this.simulate = new Simulations();
	}
}
