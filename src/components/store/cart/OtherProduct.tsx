import { Icon as Iconify } from "@iconify/react";
import { CartItem as CartItems } from "src/pages/store";
import { toTitleCase } from "src/util/string";

interface Props extends CartItems {
	addToCart: any;
}

export default function OtherProduct({
	id,
	name,
	price,
	unit_cost,
	metadata,
	image,
	addToCart,
}: Props) {
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
				<p className="mr-7 w-[70px] font-montserrat font-bold text-gray-800 dark:text-white text-right">
					$
					{price.interval
						? price.interval === "year"
							? (unit_cost * 10.8).toFixed(2)
							: unit_cost.toFixed(2)
						: unit_cost.toFixed(2)}
				</p>
				<div
					className="p-2 bg-dank-300 hover:bg-dank-300/90 rounded-md transition-colors"
					onClick={() =>
						addToCart({
							id,
							name,
							price,
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
						className="text-gray-800 dark:text-gray-200 cursor-pointer transition-colors"
					/>
				</div>
			</div>
		</div>
	);
}
