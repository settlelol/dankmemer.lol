import axios from "axios";
import clsx from "clsx";
import { useEffect, useState } from "react";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";
import { StripePurchaseDetails } from "src/pages/api/customers/purchases/stripe/[id]";
import DisputeCreator from "./RefundRequester";
import PaymentMethod from "./PaymentMethod";
import PurchasedGoods from "./PurchasedGoods";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
}

export default function PurchaseViewer({ purchase }: Props) {
	const [loading, setLoading] = useState(true);
	const [paymentMethod, setPaymentMethod] = useState<StripePurchaseDetails["paymentMethod"] | null>(null);
	const [disputing, setDisputing] = useState(false);

	useEffect(() => {
		if (loading && paymentMethod) {
			setLoading(false);
		}
	}, [paymentMethod]);

	useEffect(() => {
		axios(`/api/customers/purchases/${purchase.gateway}/${purchase._id}`)
			.then(({ data }) => {
				if (purchase.gateway === "stripe") {
					const details = data as StripePurchaseDetails;
					setPaymentMethod(details.paymentMethod);
				}
			})
			.catch(() => {
				return;
			});
	}, []);

	const closeDispute = () => {
		if (
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
							<Button variant="danger" size="medium" onClick={() => setDisputing(true)}>
								Request a refund
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
