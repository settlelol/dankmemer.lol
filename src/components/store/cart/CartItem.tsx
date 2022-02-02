import { Icon as Iconify } from "@iconify/react";
import { useEffect } from "react";
import Dropdown from "src/components/ui/Dropdown";
import { CartItem as CartItems } from "src/pages/store";

import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	index: number;
	updateQuantity: any;
	changeInterval: any;
}

export default function CartItem({
	index,
	id,
	name,
	price,
	unit_cost,
	quantity,
	metadata,
	image,
	updateQuantity,
	changeInterval,
}: Props) {
	const setQuantity = (value: any) => {
		const quantity = parseInt(value);
		if (isNaN(quantity)) return;
		if (quantity < 1 || quantity > 100) return;
		updateQuantity(index, quantity);
	};

	return (
		<div className="flex justify-between items-center mt-3">
			<div className="flex">
				<div
					className="dark:bg-black/30 w-12 h-12 rounded-md bg-center bg-[length:33px_33px] bg-no-repeat"
					style={{
						backgroundImage: `url('${image}')`,
					}}
				></div>
				<div className="flex flex-col ml-5 justify-center">
					<h4 className="font-bold leading-none text-gray-800 dark:text-white">
						{name}
					</h4>
					<p className="text-sm text-light-600 leading-none">
						{metadata?.type && toTitleCase(metadata?.type)}
					</p>
				</div>
			</div>
			<div className="flex justify-center items-center">
				<div className="mr-16">
					{metadata?.type === "membership" ? (
						<Dropdown
							content={
								<div className="flex justify-center items-center bg-[#0C120D] px-3 py-[6px] rounded-md border-[1px] border-[#3C3C3C] text-sm dark:text-[#707070] hover:dark:text-[#cccccc] transition-colors">
									<p>
										{price.interval! === "year"
											? "Annual subscription"
											: "Monthly subscription"}
									</p>
									<span className="material-icons ml-1">
										expand_more
									</span>
								</div>
							}
							options={
								price.interval === "month"
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
						<div className="flex justify-center items-center">
							<Iconify
								icon="ant-design:minus-outlined"
								height="15"
								className="mr-2 text-gray-800 dark:text-gray-400 hover:!text-white cursor-pointer transition-colors"
								onClick={() => setQuantity(quantity - 1)}
							/>
							<input
								type="text"
								className="w-8 text-center bg-transparent focus-visible:outline-none"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
							/>
							<Iconify
								icon="ant-design:plus-outlined"
								height="15"
								className="ml-2 text-gray-800 dark:text-gray-400 hover:!text-white cursor-pointer transition-colors"
								onClick={() => setQuantity(quantity + 1)}
							/>
						</div>
					)}
				</div>
				<p className="mr-7 w-[70px] font-montserrat font-bold text-gray-800 dark:text-white text-right">
					$
					{price.interval
						? price.interval === "year"
							? (unit_cost * 10.8).toFixed(2)
							: unit_cost.toFixed(2)
						: unit_cost.toFixed(2)}
				</p>
				<Iconify
					icon="bx:bx-trash"
					height="20"
					className="text-gray-800 dark:text-gray-200 hover:!text-red-400 cursor-pointer transition-colors"
				/>
			</div>
		</div>
	);
}
