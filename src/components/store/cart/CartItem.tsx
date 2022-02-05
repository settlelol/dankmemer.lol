import { Icon as Iconify } from "@iconify/react";
import { useEffect } from "react";
import Dropdown from "src/components/ui/Dropdown";
import { CartItem as CartItems } from "src/pages/store";

import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	index: number;
	updateQuantity: any;
	changeInterval: any;
	deleteItem: any;
}

export default function CartItem({
	index,
	id,
	name,
	selectedPrice,
	prices,
	unit_cost,
	quantity,
	metadata,
	image,
	updateQuantity,
	changeInterval,
	deleteItem,
}: Props) {
	const setQuantity = (value: any) => {
		const quantity = parseInt(value);
		if (isNaN(quantity)) return;
		if (quantity < 1 || quantity > 100) return;
		updateQuantity(index, quantity);
	};

	return (
		<div className="mt-3 flex items-center justify-between">
			<div className="flex">
				<div
					className="h-12 w-12 rounded-md bg-[length:33px_33px] bg-center bg-no-repeat dark:bg-black/30"
					style={{
						backgroundImage: `url('${image}')`,
					}}
				></div>
				<div className="ml-5 flex flex-col justify-center">
					<h4 className="font-bold leading-none text-gray-800 dark:text-white">
						{name}
					</h4>
					<p className="text-sm leading-none text-light-600">
						{metadata?.type && toTitleCase(metadata?.type)}
					</p>
				</div>
			</div>
			<div className="flex items-center justify-center">
				<div className="mr-16">
					{metadata?.type === "membership" ? (
						<Dropdown
							content={
								<div className="flex items-center justify-center rounded-md border-[1px] border-[#3C3C3C] bg-[#0C120D] px-3 py-[6px] text-sm transition-colors dark:text-[#707070] hover:dark:text-[#cccccc]">
									<p>
										{selectedPrice.interval! === "year"
											? "Annual subscription"
											: "Monthly subscription"}
									</p>
									<span className="material-icons ml-1">
										expand_more
									</span>
								</div>
							}
							options={
								selectedPrice.interval === "month"
									? [
											{
												onClick: () => {
													changeInterval(
														index,
														"year"
													);
												},
												label: "Annual subscription",
											},
									  ]
									: [
											{
												onClick: () => {
													changeInterval(
														index,
														"month"
													);
												},
												label: "Monthly subscription",
											},
									  ]
							}
						></Dropdown>
					) : (
						<div className="flex items-center justify-center">
							<Iconify
								icon="ant-design:minus-outlined"
								height="15"
								className="mr-2 cursor-pointer text-gray-800 transition-colors hover:!text-white dark:text-gray-400"
								onClick={() => setQuantity(quantity - 1)}
							/>
							<input
								type="text"
								className="w-8 bg-transparent text-center focus-visible:outline-none"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
							/>
							<Iconify
								icon="ant-design:plus-outlined"
								height="15"
								className="ml-2 cursor-pointer text-gray-800 transition-colors hover:!text-white dark:text-gray-400"
								onClick={() => setQuantity(quantity + 1)}
							/>
						</div>
					)}
				</div>
				<p className="mr-7 w-[70px] text-right font-montserrat font-bold text-gray-800 dark:text-white">
					$
					{selectedPrice.interval
						? selectedPrice.interval === "year"
							? (unit_cost * 10.8).toFixed(2)
							: unit_cost.toFixed(2)
						: unit_cost.toFixed(2)}
				</p>
				<Iconify
					icon="bx:bx-trash"
					height="20"
					className="cursor-pointer text-gray-800 transition-colors hover:!text-red-400 dark:text-gray-200"
					onClick={deleteItem}
				/>
			</div>
		</div>
	);
}
