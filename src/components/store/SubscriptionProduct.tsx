import Button from "../ui/Button";
import Stripe from "stripe";
import { useEffect, useState } from "react";

type SubscriptionPrice = {
	id: string;
	price: number;
	interval: string;
};

interface Subscription extends Stripe.Product {
	prices: SubscriptionPrice[];
}

export default function SubscriptionProduct({
	product,
	addToCart,
	annualPricing,
	openModal,
}: {
	product: Subscription;
	addToCart: any;
	annualPricing: Boolean;
	openModal: any;
}) {
	const [formattedPrice, setFormattedPrice] = useState<Number>(0);

	useEffect(() => {
		setFormattedPrice(
			product.prices.filter(
				(p: SubscriptionPrice) =>
					p.interval === (annualPricing ? "year" : "month")
			)[0].price / 100
		);
	}, [annualPricing]);

	return (
		<div className="flex h-64 w-52 flex-col items-center justify-center rounded-lg bg-light-500 dark:bg-[#060A07]">
			<div
				className="h-[90px] w-[90px]"
				style={{
					backgroundImage: `url('${product.images[0]}')`,
					backgroundSize: "contain",
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
				}}
			></div>
			<div className="mt-4 text-center">
				<h3 className="text-xl font-bold leading-tight text-dark-200 dark:text-light-100">
					{product.name}
				</h3>
				<p className="text-base leading-tight text-light-600">
					${formattedPrice.toFixed(2)} per{" "}
					{annualPricing ? "year" : "month"}
				</p>
			</div>
			<div className="mt-6 flex flex-col">
				<Button
					size="small"
					onClick={() => {
						addToCart({
							id: product.id,
							name: product.name,
							price: {
								id: product.prices.filter(
									(price) =>
										price.interval ===
										(annualPricing ? "year" : "month")
								)[0].id,
								type: "recurring",
								interval: annualPricing ? "year" : "month",
							},
							unit_cost: formattedPrice,
							quantity: 1,
							metadata: product.metadata,
							image: product.images[0],
						});
					}}
				>
					Add to cart
				</Button>
				<p
					className="mt-1 cursor-pointer text-center text-xs text-dank-300 underline dark:text-[#6A6C6A]"
					onClick={openModal}
				>
					View benefits
				</p>
			</div>
		</div>
	);
}
