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

export interface CycleExecution {
	tenure_type: keyof typeof BillingType;
	sequence: BillingType;
	cycles_completed: number;
	cycles_remaining?: number;
	current_pricing_scheme_version?: number;
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
