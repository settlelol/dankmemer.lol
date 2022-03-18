import { BillingAddress } from "..";

export interface Payer {
	email_address: string;
	payer_id: string;
	name: Name;
	phone: Phone;
	birthday: string;
	tax_info?: TaxInfo;
	address: BillingAddress;
}

interface Name {
	prefix: string;
	given_name: string;
	middle_name: string;
	surname: string;
	suffix: string;
	full_name: string;
}

interface Phone {
	phone_type: "FAX" | "HOME" | "MOBILE" | "OTHER" | "PAGER";
	phone_number: {
		national_number: string;
	};
}

interface TaxInfo {
	tax_id: string;
	tax_type: "BR_CPF" | "BR_CNPJ";
}
