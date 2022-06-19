import { useState } from "react";
import PaymentMethod from "src/components/store/PaymentMethod";
import { Title } from "src/components/Title";
import { SensitiveCustomerData } from "src/pages/api/customers/[userId]";

interface Props {
	customer: SensitiveCustomerData;
}

export default function SavedPaymentMethods({ customer }: Props) {
	const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

	return (
		<section className="w-full max-w-lg">
			<Title size="medium" className="font-semibold">
				Payment Methods
			</Title>
			{customer.cards.default && (
				<PaymentMethod key={customer.cards.default.id} paymentMethod={customer.cards.default} isDefault />
			)}
			{customer.cards.other.map((paymentMethod) => (
				<PaymentMethod
					key={paymentMethod.id}
					paymentMethod={paymentMethod}
					selected={selectedPaymentMethods.includes(paymentMethod.id)}
					select={() => setSelectedPaymentMethods((curr) => [...curr, paymentMethod.id])}
				/>
			))}
		</section>
	);
}
