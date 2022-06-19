import { Dispatch, SetStateAction, useEffect, useState } from "react";
import PaymentMethod from "src/components/store/PaymentMethod";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { SensitiveCustomerData } from "src/pages/api/customers/[userId]";
import { PossibleDialogViews } from "src/pages/dashboard/@me";
import { Icon as Iconify } from "@iconify/react";
import Dropdown from "src/components/ui/Dropdown";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/router";

interface Props {
	userId: string;
	customer: SensitiveCustomerData;
	onSelectedCardsChange: Dispatch<SetStateAction<string[]>>;
	openView: (view: PossibleDialogViews) => void;
}

export default function SavedPaymentMethods({ userId, customer, onSelectedCardsChange, openView }: Props) {
	const router = useRouter();
	const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

	useEffect(() => {
		onSelectedCardsChange(selectedPaymentMethods);
	}, [selectedPaymentMethods]);

	const addOrRemoveSelect = (id: string) => {
		if (!selectedPaymentMethods.includes(id)) {
			setSelectedPaymentMethods((curr) => [...curr, id]);
		} else {
			setSelectedPaymentMethods((curr) => curr.filter((el) => el !== id));
		}
	};

	const makeCardDefault = async (id: string) => {
		try {
			await axios({
				url: `/api/customers/${userId}/cards/default`,
				method: "POST",
				data: {
					id,
				},
			});
			router.reload();
		} catch {
			toast.error("Failed to make card default. Please try again later.");
		}
	};

	return (
		<section className="w-full max-w-lg">
			<div className="mb-1 flex items-center justify-between">
				<Title size="medium" className="font-semibold">
					Payment Methods
				</Title>
				<div className="flex space-x-3">
					{selectedPaymentMethods.length >= 1 && (
						<Dropdown
							content={
								<Button size="small" className="flex w-36 justify-between space-x-1 pr-1">
									<span>Manage card{selectedPaymentMethods.length !== 1 ? "s" : ""}</span>
									<span>
										<Iconify icon="eva:chevron-down-fill" height={20} />
									</span>
								</Button>
							}
							options={[
								{
									label: (
										<>
											{selectedPaymentMethods.length === 1 ? (
												<span className="dark:text-neutral-300">Set as Default</span>
											) : (
												<span className="cursor-not-allowed dark:text-neutral-300/50">
													Set as Default
												</span>
											)}
										</>
									),
									...(selectedPaymentMethods.length === 1 && {
										onClick: () => makeCardDefault(selectedPaymentMethods[0]),
									}),
								},
								{
									label: "Delete selected",
									variant: "danger",
									onClick: () => openView("delete-cards"),
								},
							]}
						/>
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
						multiSelect
					/>
				))}
			</div>
		</section>
	);
}
