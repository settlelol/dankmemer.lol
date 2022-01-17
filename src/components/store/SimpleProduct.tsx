import Button from "../ui/Button";

interface Product {
	name: string;
	image: string;
	price: number;
}

export default function SimpleProduct({ name, image, price }: Product) {
	return (
		<div className="w-52 h-64 bg-light-500 dark:bg-dark-400 flex flex-col justify-center items-center rounded-lg">
			<img src={image} width={90} height={90} />
			<div className="text-center mt-4">
				<h3 className="text-xl font-bold text-dark-200 dark:text-light-100 leading-tight">
					{name}
				</h3>
				<p className="text-base text-light-600 leading-tight">
					${price.toFixed(2)}
				</p>
			</div>
			<div className="mt-6 flex flex-col">
				<Button size="small">Add to cart</Button>
				<p className="underline text-dank-300 dark:text-[#6A6C6A] text-xs cursor-pointer mt-1">
					View possible drops
				</p>
			</div>
		</div>
	);
}
