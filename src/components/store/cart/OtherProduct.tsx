import { Icon as Iconify } from "@iconify/react";
import { CartItem as CartItems } from "src/pages/store";
import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	addToCart: any;
}

export default function OtherProduct({
	id,
	name,
	selectedPrice,
	prices,
	unit_cost,
	metadata,
	image,
	addToCart,
}: Props) {
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
				<p className="mr-7 w-[70px] text-right font-montserrat font-bold text-gray-800 dark:text-white">
					$
					{selectedPrice.interval
						? selectedPrice.interval === "year"
							? (unit_cost * 10.8).toFixed(2)
							: unit_cost.toFixed(2)
						: unit_cost.toFixed(2)}
				</p>
				<div
					className="rounded-md bg-dank-300 p-2 transition-colors hover:bg-dank-300/90"
					onClick={() =>
						addToCart({
							id,
							name,
							selectedPrice,
							prices,
							unit_cost,
							quantity: 1,
							metadata,
							image,
						})
					}
				>
					<Iconify
						icon="akar-icons:cart"
						height="20"
						className="cursor-pointer text-gray-800 transition-colors dark:text-gray-200"
					/>
				</div>
			</div>
		</div>
	);
}
