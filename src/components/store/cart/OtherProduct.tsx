import { Icon as Iconify } from "@iconify/react";
import { UpsellProduct } from "src/pages/store/cart";
import { toTitleCase } from "src/util/string";

export default function OtherProduct({
	id,
	name,
	prices,
	type,
	image,
	addToCart,
}: UpsellProduct & { addToCart: (id: string) => void }) {
	return (
		<div className="mt-3 flex items-center justify-between">
			<div className="flex">
				<div
					className="h-12 min-h-[48px] w-12 min-w-[48px] rounded-md bg-black/10 bg-[length:33px_33px] bg-center bg-no-repeat dark:bg-black/30"
					style={{
						backgroundImage: `url('${image}')`,
					}}
				></div>
				<div className="ml-5 flex flex-col justify-center">
					<h4 className="text-sm font-bold leading-none text-gray-800 dark:text-white sm:text-base">
						{name}
					</h4>
					<p className="text-sm leading-none text-light-600">{type && toTitleCase(type)}</p>
				</div>
			</div>
			<div className="flex items-center justify-center">
				<p className="mr-7 w-[70px] text-right font-montserrat text-sm font-semibold text-gray-800 dark:text-white sm:text-base">
					${(prices[0].value / 100).toFixed(2)}
				</p>
				<div
					className="rounded-md bg-dank-300 p-2 transition-colors hover:bg-dank-300/90"
					onClick={() => addToCart(id)}
				>
					<Iconify
						icon="akar-icons:cart"
						height="20"
						className="cursor-pointer text-white transition-colors dark:text-gray-200"
					/>
				</div>
			</div>
		</div>
	);
}
