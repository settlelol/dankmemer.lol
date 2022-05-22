import { PaymentAmount } from "..";
import { CycleExecution } from "../Plans/BillingCycle";

export interface SubscriptionBillingInfo {
	outstanding_balance: PaymentAmount;
	cycle_executions?: CycleExecution[];
	last_payment?: CapturedPayment;
	next_billing_time?: string;
	final_payment_time?: string;
	failed_payments_count: number;
	last_failed_payment?: FailedPayment;
}

interface CapturedPayment {
	status: string;
	amount: PaymentAmount;
	time: string;
}

interface FailedPayment {
	amount: PaymentAmount;
	time: string;
	reason_code?:
		| "PAYMENT_DENIED"
		| "INTERNAL_SERVER_ERROR"
		| "PAYEE_ACCOUNT_RESTRICTED"
		| "PAYER_ACCOUNT_RESTRICTED"
		| "PAYER_CANNOT_PAY"
		| "SENDING_LIMIT_EXCEEDED"
		| "TRANSACTION_RECEIVING_LIMIT_EXCEEDED"
		| "CURRENCY_MISMATCH";
	next_payment_retry_time?: string;
}
