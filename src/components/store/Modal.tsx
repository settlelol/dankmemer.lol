import MarkdownIt from "markdown-it";
import { useEffect, useState } from "react";
import { tailwindHtml } from "src/util/blog";
import Button from "../ui/Button";
import { toTitleCase } from "../../util/string";
import axios from "axios";
import { ProductDetails } from "src/pages/api/store/product/details";
import LoadingPepe from "../LoadingPepe";

interface Props {
	productId: string;
	add: () => void;
	close: () => void;
}

export default function Modal({ productId, add, close }: Props) {
	const mdParser = new MarkdownIt();
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [image, setImage] = useState("");
	const [prices, setPrices] = useState<ProductDetails["prices"]>([]);
	const [category, setCategory] = useState<ProductDetails["category"]>();
	const [primaryTitle, setPrimaryTitle] = useState("");
	const [primaryContent, setPrimaryContent] = useState<string>();
	const [secondaryTitle, setSecondaryTitle] = useState("");
	const [secondaryContent, setSecondaryContent] = useState<string>();

	useEffect(() => {
		axios(`/api/store/product/details?id=${productId}`)
			.then(({ data }: { data: ProductDetails }) => {
				setName(data.name);
				setType(data.type);
				setImage(data.image);
				setPrices(data.prices);
				setPrimaryTitle(data.body.primary.title);
				setPrimaryContent(data.body.primary.content);

				if (data.category) {
					setCategory(data.category);
				}

				if (data.body.secondary) {
					setSecondaryTitle(data.body.secondary.title ?? "Additional benefits");
					setSecondaryContent(data.body.secondary.content);
				}
				setLoading(false);
			})
			.catch((e) => {
				if (process.env.NODE_ENV !== "production") {
					console.error(e.message.replace(/"/g, ""));
				}
			});
	}, []);

	return (
		<div
			id="modal-background"
			className="absolute top-0 left-0 z-[999999999999] grid h-[100vh] w-[100vw] place-items-center bg-black bg-opacity-70"
			onClick={() => close()}
		>
			<div
				className="relative h-4/6 w-3/12 max-w-[480px] rounded-md bg-light-200 px-8 py-7 text-black motion-safe:animate-slide-in dark:bg-dank-500 dark:text-white"
				onClick={(e) => e.stopPropagation()}
			>
				{loading ? (
					<LoadingPepe />
				) : (
					<>
						<div className="flex">
							<div
								className="mr-4 h-32 w-32 rounded-md bg-black/20 bg-[length:100px_100px] bg-center bg-no-repeat dark:bg-black/40"
								style={{
									backgroundImage: `url('${image}')`,
								}}
							></div>
							<div>
								<h1 className="text-2xl font-bold">{name}</h1>
								<p className="text-neutral-800 dark:text-neutral-400">
									{toTitleCase(category ?? type)}
								</p>
								<div className="mt-3">
									{prices.length > 1 ? (
										<p>
											From{" "}
											<span className="font-montserrat font-bold text-dank-300">
												${(prices[0].value / 100).toFixed(2)}
											</span>{" "}
											per month
										</p>
									) : (
										<p>
											<span className="font-montserrat font-bold text-dank-300">
												${(prices[0].value / 100).toFixed(2)}
											</span>{" "}
											each
										</p>
									)}
								</div>
								<Button
									size="small"
									className="mt-1"
									onClick={() => {
										add();
										close();
									}}
								>
									Add to cart
								</Button>
							</div>
						</div>
						<div className="mt-6 max-h-[22rem] overflow-y-auto">
							{primaryContent && (
								<>
									<h1 className="text-xl font-bold">{primaryTitle}</h1>
									<p
										dangerouslySetInnerHTML={{
											__html: tailwindHtml(mdParser.render(primaryContent)),
										}}
										className="text-sm text-gray-800 dark:text-neutral-400"
									></p>
								</>
							)}
							{secondaryContent && (
								<>
									<h1 className="mt-5 text-xl font-bold">{secondaryTitle}</h1>
									<p
										dangerouslySetInnerHTML={{
											__html: tailwindHtml(mdParser.render(secondaryContent)),
										}}
										className="text-sm text-gray-800 dark:text-neutral-400"
									></p>
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
