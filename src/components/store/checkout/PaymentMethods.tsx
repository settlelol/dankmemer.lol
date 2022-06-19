import { CardData } from "./CheckoutForm";
import PaymentMethod from "../PaymentMethod";

interface Props {
	savedPaymentMethods: CardData[] | undefined;
	defaultPaymentMethod: CardData | undefined;
	select: any;
	selected: string;
}

export default function PaymentMethods({ savedPaymentMethods, defaultPaymentMethod, select, selected }: Props) {
	return (
		<div className="mt-5">
			<h3 className="font-montserrat text-base font-bold text-neutral-700 dark:text-white">
				Your saved payment methods
			</h3>
			<p className="w-2/3 text-sm text-neutral-600 dark:text-neutral-300">
				Below are a list of previously used payment methods you have opted for us to save. Select one to use it
				again.
			</p>
			<div className="mt-3 flex flex-col space-y-5">
				{defaultPaymentMethod && (
					<PaymentMethod
						key={defaultPaymentMethod.id}
						paymentMethod={defaultPaymentMethod}
						select={() => select(defaultPaymentMethod.id)}
						selected={selected === defaultPaymentMethod.id}
						isDefault
					/>
				)}
				{savedPaymentMethods &&
					savedPaymentMethods.map((paymentMethod) => (
						<PaymentMethod
							key={paymentMethod.id}
							paymentMethod={paymentMethod}
							select={() => select(paymentMethod.id)}
							selected={selected === paymentMethod.id}
						/>
					))}
			</div>
		</div>
	);
}
