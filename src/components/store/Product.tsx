import { AnyProduct, Metadata } from "src/pages/store";
import { toTitleCase } from "src/util/string";
import Button from "../ui/Button";

interface Props {
	product: AnyProduct;
	add: () => void;
	openModal: () => void;
}

export default function Product({ product, add, openModal }: Props) {
	return (
		<div className="flex flex-col">
			<div className="mb-1 flex h-64 w-56 flex-col rounded-md border border-white/20">
				<div className="grid h-48 w-56 place-items-center">
					<div
						className="h-28 w-28 bg-contain bg-center bg-no-repeat"
						style={{ backgroundImage: `url('${product.images[0]}')` }}
					/>
				</div>
				<div className="w-full px-5">
					<Button className="w-full" onClick={() => add()}>
						Add to cart
					</Button>
					<p
						className="cursor-pointer text-center text-sm underline dark:text-neutral-400"
						onClick={openModal}
					>
						Learn more
					</p>
				</div>
			</div>
			<div className="flex items-start justify-between">
				<div className="flex flex-col">
					<h6 className="font-bold">{product.name}</h6>
					<p className="-mt-1.5 text-sm dark:text-neutral-400">{toTitleCase(product.metadata.type)}</p>
				</div>
				<div className="flex flex-col text-right">
					<h6 className="font-bold text-dank-300">${(product.prices[0].price / 100).toFixed(2)}</h6>
					<p className="-mt-1.5 text-sm dark:text-neutral-400">
						{(product.metadata as Metadata).type === "subscription" ? "per month" : "each"}
					</p>
				</div>
			</div>
		</div>
	);
}
