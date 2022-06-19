import { useState } from "react";
import PaymentMethod from "src/components/store/PaymentMethod";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { SensitiveCustomerData } from "src/pages/api/customers/[userId]";
import { PossibleDialogViews } from "src/pages/dashboard/@me";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	customer: SensitiveCustomerData;
	openView: (view: PossibleDialogViews) => void;
}

export default function SavedPaymentMethods({ customer, openView }: Props) {
	const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

	const addOrRemoveSelect = (id: string) => {
		if (!selectedPaymentMethods.includes(id)) {
			setSelectedPaymentMethods((curr) => [...curr, id]);
		} else {
			setSelectedPaymentMethods((curr) => curr.filter((el) => el !== id));
		}
	};

	return (
		<section className="w-full max-w-lg">
			<div className="flex items-center justify-between">
				<Title size="medium" className="font-semibold">
					Payment Methods
				</Title>
				<div className="space-x-3">
					{selectedPaymentMethods.length >= 1 && (
						<Button size="small" className="space-x-1 pr-1">
							<span>Manage</span>
							<span>
								<Iconify icon="eva:chevron-down-fill" height={20} />
							</span>
						</Button>
					)}
					<Button size="small" onClick={() => openView("new-card")}>
						Add new
					</Button>
				</div>
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
						select={() => addOrRemoveSelect(paymentMethod.id)}
					/>
				))}
			</div>
		</section>
	);
}
