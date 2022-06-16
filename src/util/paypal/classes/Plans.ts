import { createPayPal } from "../PayPalEndpoint";
import { PaymentAmount, PayPalResponseError } from "../types";
import { BillingCycle } from "../types/Plans/BillingCycle";
import { LinkDescription } from "./Products";

export interface Plan {
	id: string;
	product_id: string;
	name: string;
	status: "CREATED" | "INACTIVE" | "ACTIVE";
	description?: string;
	billing_cycles: BillingCycle[];
	payment_preferences: PaymentPreferences;
	taxes?: Taxes;
	quantity_supported?: boolean;
	create_time: string;
	update_time: string;
	links: LinkDescription[];
}

interface PaymentPreferences {
	auto_bill_outstanding: boolean;
	setup_fee?: PaymentAmount;
	setup_fee_failure_action: "CONTINUE" | "CANCEL";
	payment_failure_threshold: number;
}

interface Taxes {
	percentage: string;
	inclusive?: boolean;
}

interface PlansListResponse {
	plans: Plan[];
	total_items: number;
	total_pages: number;
	links: LinkDescription[];
}

interface CreatePlanParams extends Omit<Plan, "id" | "status" | "create_time" | "update_time" | "links"> {
	status: "CREATED" | "ACTIVE";
}

export default class Plans {
	public async list() {
		const httpClient = await createPayPal();

		const res = await httpClient({
			url: `/v1/billing/plans`,
			method: "GET",
		});
		const data: PlansListResponse | PayPalResponseError = res.data;
		return data;
	}

	public async retrieve(id: string): Promise<Plan> {
		const httpClient = await createPayPal();

		try {
			return (
				await httpClient({
					url: `/v1/billing/plans/${id}`,
					method: "GET",
				})
			).data as Plan;
		} catch (e) {
			throw e as PayPalResponseError;
		}
	}

	public async create(options: CreatePlanParams): Promise<Plan> {
		const httpClient = await createPayPal();

		if (!options) {
			throw new Error("No plan data was provided.");
		} else {
			try {
				return (
					await httpClient({
						url: `/v1/billing/plans`,
						method: "POST",
						data: { ...options },
					})
				).data as Plan;
			} catch (e) {
				throw e as PayPalResponseError;
			}
		}
	}
}
