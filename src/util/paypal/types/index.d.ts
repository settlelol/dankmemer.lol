interface PayPalResponseError {
	error: string;
	error_description: string;
}

export interface PayPalCartItem {
	name: string;
	unit_amount: {
		currency_code: "USD";
		value: string;
	};
	quantity: string;
	sku: string;
	category: string;
}

export interface BillingAddress {
	address_line_1?: string;
	address_line_2?: string;
	admin_area_1?: string;
	admin_area_2?: string;
	postal_code?: string;
	country_code: string;
}
