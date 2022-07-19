import axios from "axios";
import MarkdownIt from "markdown-it";
import { useEffect, useState } from "react";
import LoadingPepe from "src/components/LoadingPepe";
import { ProductDetails } from "src/pages/api/store/product/details";
import { tailwindHtml } from "src/util/blog";

export default function SubscriptionInfo({ productId }: { productId: string }) {
	const mdParser = new MarkdownIt();
	const [loading, setLoading] = useState(true);

	const [primaryTitle, setPrimaryTitle] = useState("");
	const [primaryContent, setPrimaryContent] = useState<string>();
	const [secondaryTitle, setSecondaryTitle] = useState("");
	const [secondaryContent, setSecondaryContent] = useState<string>();

	useEffect(() => {
		if (productId.length >= 1) {
			axios(`/api/store/product/details?id=${productId}`)
				.then(({ data }: { data: ProductDetails }) => {
					setPrimaryTitle(data.body.primary.title);
					setPrimaryContent(data.body.primary.content);

					if (data.body.secondary) {
						setSecondaryTitle(data.body.secondary.title ?? "Additional benefits");
						setSecondaryContent(data.body.secondary.content);
					}
					setLoading(false);
				})
				.catch((e) => {
					if (process.env.NODE_ENV !== "production" && process.env.IN_TESTING) {
						console.error(e.message.replace(/"/g, ""));
					}
				});
		}
	}, [productId]);

	return (
		<section className="mt-5">
			{loading ? (
				<LoadingPepe />
			) : (
				primaryContent && (
					<>
						<h1 className="text-xl font-bold">{primaryTitle}</h1>
						<p
							dangerouslySetInnerHTML={{
								__html: tailwindHtml(mdParser.render(primaryContent)),
							}}
							className="text-sm text-gray-800 dark:text-neutral-400"
						></p>
					</>
				)
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
		</section>
	);
}
