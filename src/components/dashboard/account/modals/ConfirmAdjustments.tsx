import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { SubscriptionOption } from "./AdjustSubscription";
import { Icon as Iconify } from "@iconify/react";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/router";

interface Props {
	userId: string;
	current: Omit<SubscriptionOption, "price"> & { price: string };
	newSub: SubscriptionOption;
}

export default function ConfirmAdjustments({ userId, current, newSub }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>();

	const submitChanges = () => {
		setLoading(true);
		axios({
			url: `/api/customers/${userId}/subscription/change`,
			method: "PATCH",
			data: {
				newProduct: newSub.id,
				newPrice: newSub.price.id,
			},
		})
			.then(() => {
				router.reload();
			})
			.catch((e) => {
				if (e.response.status === 422) {
					setError(e.response.data.message);
				} else {
					setError("Something went wrong. Please try again later.");
				}
			})
			.finally(() => {
				setLoading(false);
			});
	};

	return (
		<>
			<Title size="medium" className="font-semibold">
				Confirm Subscription Changes
			</Title>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				If you are changing your subscription to a tier or billing interval that has a greater cost than which
				you are billed currently you will be charged the difference{" "}
				<span className="text-black dark:text-neutral-200">immediately</span>.
			</p>
			<section className="my-5">
				<Title size="small" className="font-semibold">
					Your Changes
				</Title>
				<div className="mt-2 flex w-full justify-between rounded border-2 border-black/20 py-3 px-4 dark:border-white/10">
					<div className="flex w-36 items-center justify-start space-x-3">
						<img src={current.image} width={32} />
						<div className="flex flex-col">
							<p className="text-sm">{current.name}</p>
							<p className="text-xs text-neutral-700 dark:text-neutral-300">
								{current.price} / {current.interval.count > 1 ? current.interval.count : ""}{" "}
								{current.interval.period}
								{current.interval.count !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
					<div className="grid place-items-center">
						<Iconify icon="akar-icons:arrow-right" height={20} />
					</div>
					<div className="flex w-36 items-center justify-end space-x-3">
						<img src={newSub.image} width={32} />
						<div className="flex flex-col">
							<p className="text-sm">{newSub.name}</p>
							<p className="text-xs text-neutral-700 dark:text-neutral-300">
								{newSub.price.value} / {newSub.interval.count > 1 ? newSub.interval.count : ""}{" "}
								{newSub.interval.period}
								{newSub.interval.count !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
				</div>
			</section>
			<div className="mt-3 flex justify-end">
				<Button
					onClick={(e) => {
						e.preventDefault();
						submitChanges();
					}}
					loading={{
						state: loading,
						text: "Applying changes",
					}}
				>
					Confirm changes
				</Button>
			</div>
			{error && <p className="mt-2 text-right text-sm text-red-500">{error}</p>}
		</>
	);
}
