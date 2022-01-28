import MarkdownIt from "markdown-it";
import { useEffect, useState } from "react";
import { tailwindHtml } from "src/util/blog";
import Stripe from "stripe";
import Button from "../ui/Button";

import { toTitleCase } from "../../util/string";

type SubscriptionPrice = {
	id: string;
	price: number;
	interval: string;
};

interface Product extends Stripe.Product {
	price?: number;
	prices?: SubscriptionPrice[];
}

export default function Modal({
	product,
	annualPricing,
	addToCart,
	closeModal,
	cta,
}: {
	product: Product | undefined;
	annualPricing?: Boolean;
	addToCart: any;
	closeModal: any;
	cta?: {
		text: string;
		callback: any;
	};
}) {
	const mdParser = new MarkdownIt();

	const [price, setPrice] = useState("");

	const [exclusiveBenefits, setExclusiveBenefits] = useState("");
	const [otherBenefits, setOtherBenefits] = useState("");

	useEffect(() => {
		if (product!.prices) {
			setPrice(
				(
					product!.prices.filter(
						(price) =>
							price.interval ===
							(annualPricing ? "year" : "month")
					)[0].price / 100
				).toFixed(2)
			);
		} else if (product!.price) setPrice((product!.price! / 100).toFixed(2));
		// TODO: API request to get benefits for the product that is being shown.
	}, []);

	return (
		<div
			id="modal-background"
			className="grid place-items-center top-0 left-0 absolute w-[100vw] h-[100vh] bg-black bg-opacity-70 z-[999999999999]"
			onClick={closeModal}
		>
			<div
				className="relative w-3/12 h-4/6 px-8 py-7 rounded-md dark:bg-[#1C2F1E] motion-safe:animate-slide-in"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex">
					<div className="w-32 h-32 mr-4 rounded-md bg-black bg-opacity-40"></div>
					<div>
						<h1 className="text-2xl font-bold">{product!.name}</h1>
						<p className="text-[#A0A8A1]">
							{product!.metadata.type &&
								toTitleCase(product!.metadata?.type)}
						</p>
						<div className="mt-4 font-montserrat">
							{annualPricing === undefined && (
								<span className="text-sm">One for </span>
							)}
							<span className="text-dank-300 text-lg font-bold">
								${price}
							</span>{" "}
							{annualPricing !== undefined && (
								<span className="text-sm">
									per {annualPricing ? "year" : "month"}
								</span>
							)}
						</div>
						<Button
							size="small"
							className="mt-1"
							onClick={() => {
								addToCart({
									id: product!.id,
									name: product!.name,
									price: {
										type: "recurring",
										interval: "",
									},
									unit_cost: price,
									quantity: 1,
									metadata: product!.metadata,
								});
								closeModal();
							}}
						>
							Add to cart
						</Button>
					</div>
				</div>
				<div className="mt-6">
					<h1 className="text-xl font-bold">Exclusive benefits</h1>
					<p
						dangerouslySetInnerHTML={{
							__html: tailwindHtml(
								mdParser.render(exclusiveBenefits)
							),
						}}
					></p>
					{otherBenefits.length < 1 && (
						<>
							<h1 className="mt-5 text-xl font-bold">
								Also included
							</h1>
							<p
								dangerouslySetInnerHTML={{
									__html: tailwindHtml(
										mdParser.render(exclusiveBenefits)
									),
								}}
							></p>
						</>
					)}
				</div>
				{cta && (
					<div className="absolute left-0 bottom-7 grid place-items-center w-full box-border">
						<Button size="medium-large" onClick={cta.callback}>
							{cta.text}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
