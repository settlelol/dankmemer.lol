import { createPayPal } from "../PayPalEndpoint";
import { PayPalResponseError } from "../types";
import { Payer } from "../types/Orders/Payer";
import { PurchaseUnit } from "../types/Orders/PurchaseUnit";
import { LinkDescription } from "./Products";

export interface OrdersRetrieveResponse {
	id: string;
	payment_source: any;
	intent: "CAPTURE" | "AUTHORIZE";
	processing_instruction?:
		| "ORDER_COMPLETE_ON_PAYMENT_APPROVAL"
		| "NO_INSTRUCTION";
	payer: Payer;
	purchase_units: PurchaseUnit[];
	status:
		| "CREATED"
		| "SAVED"
		| "APPROVED"
		| "VOIDED"
		| "COMPLETED"
		| "PAYER_ACTION_REQUIRED";
	links: LinkDescription[];
	create_time: string;
	update_time: string;
}

export default class Orders {
	public async retrieve(id: string) {
		const httpClient = await createPayPal();

		const res = await httpClient({
			url: `/v2/checkout/orders/${id}`,
			method: "GET",
		});
		const data: OrdersRetrieveResponse | PayPalResponseError = res.data;
		return data;
	}
}
