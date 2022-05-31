import axios from "axios";
import { useEffect, useState } from "react";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";
import { StripePurchaseDetails } from "src/pages/api/customers/purchases/[id]";
import DisputeCreator from "./RefundRequester";
import PaymentMethod from "./PaymentMethod";
import PurchasedGoods from "./PurchasedGoods";
import clsx from "clsx";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
}

export enum RefundStatus {
	OPEN_WAITING_FOR_SUPPORT = 0,
	OPEN_WAITING_FOR_CUSTOMER = 1,
	CLOSED_WON = 2,
	CLOSED_LOSS = 3,
}

export interface Refund {
	order: string;
	gateway: "stripe" | "paypal";
	purchasedBy: string;
	emails: string[];
	purchaseType: string;
	reason: string;
	content: string;
	status: RefundStatus;
}

export default function PurchaseViewer({ purchase }: Props) {
	const [loading, setLoading] = useState(true);
	const [paymentMethod, setPaymentMethod] = useState<StripePurchaseDetails["paymentMethod"] | null>(null);
	const [disputing, setDisputing] = useState(false);
	const [activeDispute] = useState<boolean | null>(
		purchase.refundStatus === RefundStatus.OPEN_WAITING_FOR_CUSTOMER ||
			purchase.refundStatus === RefundStatus.OPEN_WAITING_FOR_SUPPORT
	);

	useEffect(() => {
		if (loading && ((purchase.gateway === "stripe" && paymentMethod) || purchase.gateway === "paypal")) {
			setLoading(false);
		}
	}, [paymentMethod]);

	useEffect(() => {
		if (purchase.gateway === "stripe") {
			axios(`/api/customers/purchases/${purchase._id}`)
				.then(({ data }) => {
					const details = data as StripePurchaseDetails;
					setPaymentMethod(details.paymentMethod);
				})
				.catch(() => {
					return;
				});
		}
	}, []);

	const closeDispute = (bypass = false) => {
		if (
			bypass ||
			confirm(
				"Returning to the previous screen will close this dispute window and all information that has been entered will be forgotten. Are you sure you want to continue?"
			)
		) {
			setDisputing(false);
		}
	};

	return disputing ? (
		<DisputeCreator close={closeDispute} purchase={purchase} />
	) : (
		<div>
			<Title size="big">Viewing order</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				In-depth details on a previous order that you have placed.
			</p>
			{loading ? (
				<LoadingPepe />
			) : (
				<div className="mt-3">
					{purchase.gateway === "stripe" && paymentMethod && <PaymentMethod paymentMethod={paymentMethod} />}
					<PurchasedGoods purchase={purchase} />
					<div className="mt-5">
						<Title size="small" className="font-semibold">
							Actions
						</Title>
						<div className="flex space-x-5">
							<Button
								variant="primary"
								onClick={() => (window.location.href = "https://discord.gg/dankmemerbot")}
							>
								Need support
							</Button>
							<Button
								variant={activeDispute ? "dark" : "danger"}
								size="medium"
								onClick={() => setDisputing(true)}
								className={clsx(
									activeDispute &&
										"text-neutral-500 hover:bg-opacity-100 dark:text-neutral-500 dark:hover:bg-opacity-100"
								)}
								disabled={activeDispute!}
							>
								Request a refund
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
