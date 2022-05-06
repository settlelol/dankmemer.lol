import clsx from "clsx";
import { useEffect, useState } from "react";
import Dropdown from "src/components/ui/Dropdown";
import Input from "src/components/store/Input";
import { Icon as Iconify } from "@iconify/react";
import Tooltip from "src/components/ui/Tooltip";

interface Props {
	mode: "single" | "recurring" | null;
	index: number;
	updatePrice: any;
}

export default function ProductCreatorPrice({
	mode,
	index,
	updatePrice,
}: Props) {
	const [price, setPrice] = useState("");
	const [interval, setInterval] = useState("");
	const [intervalCount, setIntervalCount] = useState("");

	useEffect(() => {
		updatePrice(index, {
			value: price,
			interval,
			intervalCount,
		});
	}, [price, interval, intervalCount]);

	return (
		<div className="rounded-lg py-5 px-4 dark:bg-dank-500">
			<div className="flex w-full space-x-4">
				<div className="w-1/4">
					<Input
						width="w-full"
						type={"text"}
						placeholder={"9.99"}
						value={price}
						icon={"bi:currency-dollar"}
						className="!pl-8"
						iconSize={16}
						onChange={(e) => {
							if (!Number.isNaN(e.target.value)) {
								setPrice(e.target.value);
							}
						}}
						onBlur={(e) => {
							if (!Number.isNaN(parseFloat(e.target.value))) {
								setPrice(parseFloat(e.target.value).toFixed(2));
							}
						}}
						label={
							<>
								Value
								<sup className="text-red-500">*</sup>
							</>
						}
					/>
				</div>
				{mode === "recurring" && (
					<>
						<div className="w-32">
							<p className="mb-1 text-neutral-600 dark:text-neutral-300">
								Billing interval
								<sup className="text-red-500">*</sup>
							</p>
							<Dropdown
								content={
									<div
										className={clsx(
											"flex items-center justify-between",
											"rounded-md border-[1px] border-[#3C3C3C]",
											"bg-light-500 transition-colors dark:bg-black/30 dark:text-neutral-400",
											"w-full px-3 py-2 text-sm"
										)}
									>
										<p>
											{interval.length >= 1
												? interval
												: "Select one"}
										</p>
										<Iconify
											icon="ic:baseline-expand-more"
											height={15}
											className="ml-1"
										/>
									</div>
								}
								options={[
									{
										label: "Daily",
										onClick: () => setInterval("Daily"),
									},
									{
										label: "Weekly",
										onClick: () => setInterval("Weekly"),
									},
									{
										label: "Monthly",
										onClick: () => setInterval("Monthly"),
									},
									{
										label: "Annually",
										onClick: () => setInterval("Annually"),
									},
								]}
								isInput={false}
								requireScroll={false}
							/>
						</div>
						<div className="w-14">
							<Input
								type={"text"}
								label={
									<p className="flex items-center space-x-1">
										<span>#</span>
										<Tooltip content="Number of intervals">
											<Iconify
												icon={
													"ant-design:question-circle-filled"
												}
											/>
										</Tooltip>
									</p>
								}
								defaultValue="1"
								width="w-full"
								placeholder="1"
								value={intervalCount}
								onChange={(e) =>
									setIntervalCount(
										e.target.value.match(/\d+/)
											? e.target.value.match(/\d+/)![0]
											: ""
									)
								}
							/>
						</div>
					</>
				)}
			</div>
			{mode === "recurring" && (
				<p className="mt-1 text-sm dark:text-neutral-500">
					User will pay{" "}
					<span className="text-dank-300">${price}</span>
					{interval !== "" && (
						<>
							{" "}
							every{" "}
							<span className="text-dank-300">
								{parseInt(intervalCount) > 1
									? intervalCount
									: ""}{" "}
								{interval === "Daily"
									? "day"
									: interval === "Weekly"
									? "week"
									: interval === "Monthly"
									? "month"
									: interval === "Annually"
									? "year"
									: ""}
								{parseInt(intervalCount) > 1 ? "s" : ""}
							</span>
						</>
					)}
				</p>
			)}
		</div>
	);
}
