import MarkdownIt from "markdown-it";
import { useEffect, useState } from "react";
import { tailwindHtml } from "src/util/blog";
import Stripe from "stripe";
import Button from "../ui/Button";

import { toTitleCase } from "../../util/string";
import { ModalProps } from "src/pages/store";
import axios from "axios";

export default function Modal({
	product,
	annualPricing,
	addToCart,
	closeModal,
	titles,
	cta,
}: ModalProps) {
	const mdParser = new MarkdownIt();

	const [price, setPrice] = useState("");

	const [includedTitle, setIncludedTitle] = useState(titles.included);
	const [additionallyIncludedTitle, setAdditionallyIncludedTitle] = useState(
		titles.additional
	);

	const [included, setIncluded] = useState("");
	const [additionallyIncluded, setAdditionallyIncluded] = useState("");

	useEffect(() => {
		if (product.prices) {
			setPrice(
				(
					product.prices.filter(
						(price) =>
							price.interval ===
							(annualPricing ? "year" : "month")
					)[0].price / 100
				).toFixed(2)
			);
		} else if (product.price) setPrice((product.price! / 100).toFixed(2));
		// TODO: API request to get benefits for the product that is being shown.
		axios(`/api/store/product/details?id=${product.id}`)
			.then(({ data }) => {
				setIncludedTitle(data.primaryTitle);
				setIncluded(data.primaryBody);
				if (data.secondaryTitle && data.secondaryBody) {
					setAdditionallyIncluded(data.secondaryBody);
					setAdditionallyIncludedTitle(data.secondaryTitle);
				}
			})
			.catch((e) => {
				console.error(e);
				// closeModal()
			});
	}, []);

	return (
		<div
			id="modal-background"
			className="grid place-items-center top-0 left-0 absolute w-[100vw] h-[100vh] bg-black bg-opacity-70 z-[999999999999]"
			onClick={closeModal}
		>
			<div
				className="relative w-3/12 max-w-[480px] h-4/6 px-8 py-7 rounded-md text-black dark:text-white bg-light-200 dark:bg-dank-500 motion-safe:animate-slide-in"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex">
					<div
						className="w-32 h-32 mr-4 rounded-md bg-black/20 dark:bg-black/40 bg-center bg-[length:100px_100px] bg-no-repeat"
						style={{
							backgroundImage: `url('${product.images[0]}')`,
						}}
					></div>
					<div>
						<h1 className="text-2xl font-bold">{product.name}</h1>
						<p className="text-black/40 dark:text-white/50">
							{product.metadata.type &&
								toTitleCase(product.metadata?.type)}
						</p>
						<div className="mt-3 font-montserrat">
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
									id: product.id,
									name: product.name,
									price: {
										type:
											product.metadata.type ===
											"membership"
												? "recurring"
												: "one_time",
									},
									unit_cost: parseFloat(price),
									quantity: 1,
									metadata: product.metadata,
									image: product.images[0],
								});
								closeModal();
							}}
						>
							Add to cart
						</Button>
					</div>
				</div>
				<div className="mt-6 max-h-[22rem] overflow-y-auto">
					{included.length > 1 && (
						<>
							<h1 className="text-xl font-bold">
								{includedTitle}
							</h1>
							<p
								dangerouslySetInnerHTML={{
									__html: tailwindHtml(
										mdParser.render(included)
									),
								}}
								className="text-sm text-gray-800 dark:text-zinc-300"
							></p>
						</>
					)}
					{additionallyIncluded.length > 1 && (
						<>
							<h1 className="mt-5 text-xl font-bold">
								{additionallyIncludedTitle}
							</h1>
							<p
								dangerouslySetInnerHTML={{
									__html: tailwindHtml(
										mdParser.render(additionallyIncluded)
									),
								}}
								className="text-sm text-gray-800 dark:text-zinc-300"
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
