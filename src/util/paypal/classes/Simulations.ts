import { createPayPal } from "../PayPalEndpoint";
import { LinkDescription } from "./Products";

interface WebhookSimulationOptionsA {
	/**
	 * @description The event name. Specify one of the subscribed events. For each request, provide only one event.
	 */
	event_type: WebhookEvents; // Any of the following https://developer.paypal.com/api/rest/webhooks/event-names/#link-authorizedandcapturedpayments

	/**
	 * @description The ID of the webhook. If omitted, the URL is required.
	 */
	webhook_id: string;

	/**
	 * @description The URL for the webhook endpoint. If omitted, the webhook ID is required.
	 */
	url?: never;

	/**
	 * @description The identifier for event type ex: 1.0/2.0 etc.
	 */
	resource_version?: "1.0" | "2.0";
}

interface WebhookSimulationOptionsB {
	/**
	 * @description The event name. Specify one of the subscribed events. For each request, provide only one event.
	 */
	event_type: WebhookEvents; // Any of the following https://developer.paypal.com/api/rest/webhooks/event-names/#link-authorizedandcapturedpayments

	/**
	 * @description The ID of the webhook. If omitted, the URL is required.
	 */
	webhook_id?: never;

	/**
	 * @description The URL for the webhook endpoint. If omitted, the webhook ID is required.
	 */
	url: string;

	/**
	 * @description The identifier for event type ex: 1.0/2.0 etc.
	 */
	resource_version?: "1.0" | "2.0";
}

type WebhookSimulationOptions =
	| WebhookSimulationOptionsA
	| WebhookSimulationOptionsB;

interface WebhookResponse {
	/**
	 * @description The ID of the webhook event notification.
	 */
	id: string;
	create_time: string; // Timestamp
	resource_type: string;
	event_version: "1.0" | "2.0";
	event_type: WebhookEvents; // Any of the following https://developer.paypal.com/api/rest/webhooks/event-names/#link-authorizedandcapturedpayments
	summary: string;
	resource_version: "1.0" | "2.0";
	resource: WebhookResponseResource;
}

// This is undocumented by PayPal so it may be incomplete.
interface WebhookResponseResource {
	id: string;
	create_time: string;
	update_string: string;
	state: string;
	amount: {
		total: string;
		currency: string;
		details: {
			subtotal: string;
		};
	};
	parent_payment: string;
	valid_until: string;
	links: LinkDescription[];
}

export default class Simulations {
	public async webhook(options: WebhookSimulationOptions) {
		const httpClient = await createPayPal();
		const res = await httpClient({
			method: "POST",
			url: "/v1/notifications/simulate-event",
			data: options,
		});

		const data: WebhookResponse = res.data;
		return data;
	}
}
