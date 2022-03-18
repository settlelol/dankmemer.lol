import Products from "./classes/Products";
import Webhooks from "./classes/Webhooks";
import Simulations from "./classes/Simulations";
import Orders from "./classes/Orders";

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
	orders: Orders;
	webhooks: Webhooks;
	simulate: Simulations;

	constructor() {
		this.products = new Products();
		this.orders = new Orders();
		this.webhooks = new Webhooks();
		this.simulate = new Simulations();
	}
}
