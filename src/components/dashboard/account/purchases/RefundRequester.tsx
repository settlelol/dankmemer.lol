import { Title } from "src/components/Title";
import { Icon as Iconify } from "@iconify/react";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";
import Input from "src/components/store/Input";
import Dropdown from "src/components/ui/Dropdown";
import clsx from "clsx";
import { toTitleCase } from "src/util/string";
import Link from "src/components/ui/Link";
import { useEffect, useRef, useState } from "react";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
	close: () => void;
}

export default function DisputeCreator({ purchase, close }: Props) {
	const [reason, setReason] = useState("");

	const [dropdownOptions, setDropdownOptions] = useState([
		{
			label: "Fraud/Unauthorized",
			value: "unauthorized",
		},
		{
			label: "Did not receive goods",
			value: "undelivered",
		},
		{
			label: "Other",
			value: "other",
		},
	]);

	useEffect(() => {
		const options = [...dropdownOptions];
		switch (purchase.type) {
			case "subscription":
				options.splice(1, 0, {
					label: "Unexpected renewal",
					value: "unexpected-renewal",
				});
				break;
			case "single":
				options.splice(1, 0, {
					label: "Duplicate charge",
					value: "double-charge",
				});
				break;
		}
		setDropdownOptions(options);
	}, [purchase.type]);

	return (
		<div>
			<p
				className="absolute top-4 flex cursor-pointer items-center justify-start space-x-1 text-sm transition-colors dark:text-neutral-400 hover:dark:text-neutral-200"
				onClick={close}
			>
				<Iconify icon="akar-icons:arrow-left" />
				<span>Go back to purchase details</span>
			</p>
			<Title size="big">Request a Refund</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				If you believe that you have been mischarged for this order you are able to fill out this form to
				request a refund. Please ensure you have read our{" "}
				<Link href="/refunds" className="!text-dank-300 underline hover:!text-dank-200">
					refund policy
				</Link>{" "}
				before completion.
			</p>
			<div className="mt-5">
				<div className="flex justify-between space-x-5">
					<Input
						width="w-[300px]"
						placeholder="Order ID"
						type="text"
						label={
							<>
								Order ID<sup className="text-red-500">*</sup>
							</>
						}
						value={purchase._id}
						className="dark:text-neutral-400"
						disabled
					/>
					<div className="w-2/5">
						<p className="mb-1 text-neutral-600 dark:text-neutral-300">
							Product type<sup className="text-red-500">*</sup>
						</p>
						<div
							className={clsx(
								"flex items-center justify-between",
								"rounded-md border-[1px] border-[#3C3C3C]",
								"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
								"w-full px-3 py-2 text-sm"
							)}
						>
							<p>{purchase.items[0].type === "recurring" ? "Subscription" : "One time"}</p>
							<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
						</div>
					</div>
				</div>
				<div className="mt-3">
					<div className="w-2/5">
						<p className="mb-1 text-neutral-600 dark:text-neutral-300">
							Reason for refund
							<sup className="text-red-500">*</sup>
						</p>
						<Dropdown
							content={
								<div
									className={clsx(
										"flex items-center justify-between",
										"rounded-md border-[1px] border-[#3C3C3C]",
										"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
										"w-full px-3 py-2 text-sm"
									)}
								>
									<p>{"Select one"}</p>
									<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
								</div>
							}
							options={dropdownOptions.map((option) => {
								return {
									label: option.label,
									onClick: () => setReason(option.value),
								};
							})}
							isInput={false}
							requireScroll={false}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
