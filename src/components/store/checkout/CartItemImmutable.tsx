import { Metadata } from "src/pages/store";
import { SelectedPrice } from "src/pages/store/checkout/success";

import { toTitleCase } from "src/util/string";

interface Props {
	index?: number;
	name: string;
	gifted?: string;
	selectedPrice: SelectedPrice;
	metadata?: Metadata;
	unit_cost: number;
	quantity: number;
	image?: string;
}

export default function CartItemImmutable({
	name,
	gifted,
	selectedPrice,
	unit_cost,
	quantity,
	metadata,
	image,
}: Props) {
	return (
		<div className="flex flex-col">
			<div className="mt-3 flex w-full items-center justify-between">
				<div className="flex">
					<div
						className="h-12 w-12 rounded-md bg-black/10 bg-[length:33px_33px] bg-center bg-no-repeat dark:bg-black/30"
						style={{
							backgroundImage: `url('${image}')`,
						}}
					></div>
					<div className="ml-5 flex flex-col justify-center">
						<h4 className="font-bold leading-none text-gray-800 dark:text-white">{name}</h4>
						<p className="text-sm leading-none text-light-600">
							{gifted && JSON.parse(gifted) && "(Gifted) "}
							{metadata?.type && toTitleCase(metadata?.type)}
						</p>
					</div>
				</div>
				<div className="flex flex-col">
					<p className="min-w-[60px] text-right font-montserrat font-bold leading-none text-gray-800 dark:text-white">
						$
						{selectedPrice.interval
							? selectedPrice.interval === "year"
								? (unit_cost * 10.8).toFixed(2)
								: unit_cost.toFixed(2)
							: (unit_cost * quantity).toFixed(2)}
					</p>
					{metadata?.type === "subscription" ? (
						selectedPrice.interval ? (
							<p className="text-sm leading-none text-light-600">
								Billing period: {toTitleCase(selectedPrice.interval)}ly
							</p>
						) : (
							<p className="text-sm leading-none text-light-600">
								Duration: {selectedPrice.duration!.count}{" "}
								{toTitleCase(selectedPrice.duration!.interval)}
							</p>
						)
					) : (
						<p className="text-sm leading-none text-light-600">Quantity: {quantity}</p>
					)}
				</div>
			</div>
		</div>
	);
}
