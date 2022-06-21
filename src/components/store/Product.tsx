import clsx from "clsx";
import { TIME } from "src/constants";
import { ListedProduct } from "src/pages/store";
import { toTitleCase } from "src/util/string";
import Button from "../ui/Button";

interface Props {
	product: ListedProduct;
	add: () => void;
	openModal: () => void;
}

export default function Product({ product, add, openModal }: Props) {
	return (
		<div className="flex flex-col">
			<div className="relative mb-1 flex h-64 w-56 flex-col rounded-md border border-black/30 dark:border-white/20">
				{new Date().getTime() - new Date(product.created * 1000).getTime() <= TIME.month && (
					<Badge variant="new" />
				)}
				<div className="grid h-48 w-56 place-items-center">
					<div
						className="h-28 w-28 bg-contain bg-center bg-no-repeat"
						style={{ backgroundImage: `url('${product.image}')` }}
					/>
				</div>
				<div className="w-full px-5">
					<Button className="w-full" onClick={() => add()}>
						Add to cart
					</Button>
					<p
						className="cursor-pointer text-center text-sm text-neutral-500 underline dark:text-neutral-400"
						onClick={openModal}
					>
						Learn more
					</p>
				</div>
			</div>
			<div className="flex items-start justify-between">
				<div className="flex flex-col">
					<h6 className="font-bold text-neutral-800 dark:text-white">{product.name}</h6>
					<p className="-mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
						{toTitleCase(product.type)}
					</p>
				</div>
				<div className="flex flex-col text-right">
					<h6 className="font-bold text-dank-300">${(product.prices[0].value / 100).toFixed(2)}</h6>
					<p className="-mt-1.5 text-sm text-neutral-500  dark:text-neutral-400">
						{product.type === "subscription" ? "per month" : "each"}
					</p>
				</div>
			</div>
		</div>
	);
}

const badgeVariants = {
	sale: {
		text: "SALE",
		color: "bg-red-500",
	},
	new: {
		text: "NEW",
		color: "bg-dank-300",
	},
};

interface BadgeProps {
	variant: keyof typeof badgeVariants;
}

function Badge({ variant }: BadgeProps) {
	return (
		<div className={clsx("absolute left-4 -top-4 py-1 px-3", badgeVariants[variant].color)}>
			<p className="select-none font-montserrat font-bold tracking-wide">{badgeVariants[variant].text}</p>
		</div>
	);
}
