import { useState } from "react";
import PaymentMethod from "src/components/store/PaymentMethod";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { SensitiveCustomerData } from "src/pages/api/customers/[userId]";

interface Props {
	customer: SensitiveCustomerData;
}

export default function SavedPaymentMethods({ customer }: Props) {
	const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

	return (
		<section className="w-full max-w-lg">
			<div className="flex items-center justify-between">
				<Title size="medium" className="font-semibold">
					Payment Methods
				</Title>
				<Button size="small">Add new</Button>
			</div>
			<p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
				These cards can only be used during checkouts using Stripe. PayPal cards must be managed through your
				PayPal account settings.
			</p>
			<div className="flex flex-col space-y-3">
				{customer.cards.default && (
					<div>
						<PaymentMethod
							key={customer.cards.default.id}
							paymentMethod={customer.cards.default}
							className="mb-3"
							isDefault
						/>
						{customer.cards.other.length >= 1 && <hr className="mx-auto w-11/12 dark:border-dark-300" />}
					</div>
				)}
				{customer.cards.other.map((paymentMethod) => (
					<PaymentMethod
						key={paymentMethod.id}
						paymentMethod={paymentMethod}
						selected={selectedPaymentMethods.includes(paymentMethod.id)}
						select={() => setSelectedPaymentMethods((curr) => [...curr, paymentMethod.id])}
					/>
				))}
			</div>
		</section>
	);
}
