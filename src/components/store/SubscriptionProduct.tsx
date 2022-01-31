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
		<div className="w-52 h-64 bg-light-500 dark:bg-[#060A07] flex flex-col justify-center items-center rounded-lg">
			<div
				className="w-[90px] h-[90px]"
				style={{
					backgroundImage: `url('${product.images[0]}')`,
					backgroundSize: "contain",
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
				}}
			></div>
			<div className="text-center mt-4">
				<h3 className="text-xl font-bold text-dark-200 dark:text-light-100 leading-tight">
					{product.name}
				</h3>
				<p className="text-base text-light-600 leading-tight">
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
								type: "recurring",
								interval: annualPricing ? "year" : "month",
							},
							unit_cost: formattedPrice,
							quantity: 1,
							metadata: product.metadata,
						});
					}}
				>
					Add to cart
				</Button>
				<p
					className="text-center underline text-dank-300 dark:text-[#6A6C6A] text-xs cursor-pointer mt-1"
					onClick={openModal}
				>
					View benefits
				</p>
			</div>
		</div>
	);
}
