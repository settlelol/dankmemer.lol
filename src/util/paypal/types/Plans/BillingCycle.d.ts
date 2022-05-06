import { PaymentAmount } from "..";

enum BillingType {
	TRIAL = 1,
	REGULAR = 2,
}

export interface BillingCycle {
	pricing_scheme?: PricingScheme;
	frequency: BillingFrequency;
	tenure_type: keyof typeof BillingType;
	sequence: BillingType;
	total_cycles?: number;
}

interface PricingScheme {
	version?: number;
	fixed_price?: PaymentAmount;
	pricing_modal?: "VOLUME" | "TIERED";
	tiers?: PricingTier[];
	create_time?: string;
	update_time?: string;
}

interface PricingTier {
	starting_quantity: string;
	ending_quantity: string;
	amount: PaymentAmount;
}

interface BillingFrequency {
	interval_unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
	interval_count: number;
}
