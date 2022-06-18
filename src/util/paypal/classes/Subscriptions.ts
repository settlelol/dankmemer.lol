import { createPayPal } from "../PayPalEndpoint";
import { PaymentAmount, PayPalResponseError } from "../types";
import { Payer } from "../types/Orders/Payer";
import { SubscriptionBillingInfo } from "../types/Subscriptions/BillingInfo";
import { Plan } from "./Plans";
import { LinkDescription } from "./Products";

export interface Subscription {
	id: string;
	plan_id: string;
	custom_id?: string;
	status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
	status_change_node?: string;
	status_update_time?: string;
	start_time: string;
	create_time: string;
	update_time: string;
	quantity?: string;
	billing_info?: SubscriptionBillingInfo;
	subscriber?: Payer;
	shipping_amount?: PaymentAmount;
	plan: Plan;
	links: LinkDescription[];
}

export default class Subscriptions {
	public async get(subscriptionId: string) {
		const httpClient = await createPayPal();

		if (!subscriptionId) {
			throw new Error("No plan data was provided.");
		} else {
			try {
				return (
					await httpClient({
						url: `/v1/billing/subscriptions/${subscriptionId}`,
						method: "GET",
					})
				).data as Subscription;
			} catch (e) {
				throw e as PayPalResponseError;
			}
		}
	}

	public async cancel(subscriptionId: string, reason = "Requested by user.") {
		const httpClient = await createPayPal();

		if (!subscriptionId) {
			throw new Error("No plan data was provided.");
		} else {
			try {
				return (
					await httpClient({
						url: `/v1/billing/subscriptions/${subscriptionId}/cancel`,
						method: "POST",
						data: {
							reason,
						},
					})
				).data as Subscription;
			} catch (e) {
				throw e as PayPalResponseError;
			}
		}
	}

	// PayPal does not support changing the subscribed product like Stripe does.
	// This endpoint only allows for changing billing period which isn't ideal,
	// leaving it here incase that changes in the future.
	//
	// public async update(subscriptionId: string, newPlan: string) {
	// 	const httpClient = await createPayPal();

	// 	if (!subscriptionId) {
	// 		throw new Error("No plan data was provided.");
	// 	} else {
	// 		try {
	// 			return (
	// 				await httpClient({
	// 					url: `/v1/billing/subscriptions/${subscriptionId}/revise`,
	// 					method: "POST",
	// 					data: {
	// 						plan_id: newPlan,
	// 					},
	// 				})
	// 			).data as Subscription;
	// 		} catch (e) {
	// 			throw e as PayPalResponseError;
	// 		}
	// 	}
	// }
}
