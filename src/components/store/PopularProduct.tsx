import clsx from "clsx";
import { UpsellProduct } from "src/pages/store/cart";
import { toTitleCase } from "src/util/string";
import { Title } from "../Title";
import Button from "../ui/Button";
import Link from "../ui/Link";

interface Props {
	product: UpsellProduct;
	addProduct: (id: string) => void;
}

export default function PopularProduct({ product, addProduct }: Props) {
	return (
		<div
			className={clsx(
				"relative h-40 w-[28%] rounded-md px-5 py-4 transition-shadow",
				"shadow-lg shadow-dank-300/20 hover:shadow-xl hover:shadow-dank-300/20",
				"dark:bg-dark-500"
			)}
		>
			<div className="flex items-center justify-start space-x-4">
				<div
					className="h-20 w-20 bg-contain bg-center bg-no-repeat"
					style={{
						backgroundImage: `url('${product.image}')`,
					}}
				/>
				<div>
					<Title size="small">{product.name}</Title>
					<p className="-mt-1.5 text-sm dark:text-neutral-400">{toTitleCase(product.type!)} item</p>
				</div>
			</div>
			<div className="absolute bottom-4 left-0 w-full px-5">
				<div className="flex w-full items-center justify-between space-x-2 text-base">
					<Button size="medium" className="w-7/12" onClick={() => addProduct(product.id)}>
						Purchase for ${(product.prices[0].value / 100).toFixed(2)}
					</Button>
					<Link href="#" variant="secondary" className="underline">
						Learn more
					</Link>
				</div>
			</div>
		</div>
	);
}
