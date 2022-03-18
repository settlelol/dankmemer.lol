import { BillingAddress, PayPalCartItem } from "..";
import { LinkDescription } from "../../classes/Products";

export interface PurchaseUnit {
	reference_id?: string;
	amount: PaymentAmount;
	payee?: Payee;
	payment_instruction?: PaymentInstruction;
	description?: string;
	id?: string;
	custom_id: string;
	invoice_id?: string;
	soft_descriptor?: string;
	items: PayPalCartItem[];
	shipping?: BillingAddress;
	payments: PaymentCollection;
}

interface Payee {
	email_address?: string;
	merchant_id?: string;
}

interface PaymentInstruction {
	platform_fees?: [];
	disbursement_mode?: "INSTANT" | "DELAYED";
	payee_pricing_tier_id?: string;
	payee_receivable_fx_rate_id?: string;
}

interface PaymentCollection {
	authorizations?: ProcessorResponse[];
	captures?: PaymentCapture[];
	refunds?: RefundedPayment[];
}

// TODO: (Maybe) There is a lot, not needed right now
interface ProcessorResponse {
	avs_code?: string;
	cvv_code?: string;
	response_code?: string;
	payment_advice_code?: string;
}

interface PaymentCapture {
	status?: string;
	status_details?:
		| "BUYER_COMPLAINT"
		| "CHARGEBACK"
		| "ECHECK"
		| "INTERNATIONAL_WITHDRAW"
		| "PENDING_REVIEW"
		| "RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTIONS"
		| "REFUNDED"
		| "TRANSACTION_APPROVED_AWAITING_FUNDING"
		| "UNILATERAL"
		| "VERIFICATION_REQUIRED"
		| "OTHER";
	id?: string;
	amount?: PaymentAmount;
	invoice_id?: string;
	custom_id: string;
	seller_protection?: string;
	final_capture?: boolean;
	seller_receivable_breakdown?: string;
	disbursement_mode?: "INSTANT" | "DELAYED";
	links?: LinkDescription[];
	processor_response?: ProcessorResponse;
}

interface RefundedPayment {
	status?: string;
	status_details?: any; // Documentation of this is not clear and I cbf
	id?: string;
	amount?: PaymentAmount;
	invoice_id?: string;
	note_to_payer?: string;
	seller_payable_breakdown?: any;
	links?: LinkDescription[];
	create_time?: string;
	update_time?: string;
}

interface PaymentAmount {
	currency_code?: string;
	value?: string;
}
