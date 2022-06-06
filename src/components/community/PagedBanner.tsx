import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Link from "../ui/Link";

interface Props {
	pages: BannerPage[];
	height?: string;
	duration?: number;
	isStatic?: boolean;
}

export interface BannerPage {
	title: string;
	description: string;
	image: string;
	url: string;
	buttonText: string;
	secondaryLink?: SecondaryBannerLink;
}

interface SecondaryBannerLink {
	text: string;
	url: string;
}

function useInterval(callback: any, delay: number) {
	const savedCallback = useRef<any>();

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		let id = setInterval(() => {
			savedCallback.current();
		}, delay);
		return () => clearInterval(id);
	}, [delay]);
}

export default function PagedBanner({ pages, height = "h-auto md:h-52", duration = 1000, isStatic }: Props) {
	const router = useRouter();
	const [paused, setPaused] = useState(false);
	const [timePast, setTimePast] = useState(0);
	const [pageIndex, setPageIndex] = useState(0);
	const [page, setPage] = useState<BannerPage>(pages[0]);

	useInterval(() => {
		if (!paused && !isStatic) {
			if (timePast + 1 >= duration) {
				setPageIndex((curr) => (pages.length - 1 > curr ? curr + 1 : 0));
				setTimePast(0);
			} else {
				setTimePast((time) => time + 1);
			}
		}
	}, 1);

	useEffect(() => {
		setPage(pages[pageIndex]);
	}, [pageIndex]);

	return (
		<>
			<svg
				className="imageBlur"
				style={{
					height: "1px",
					width: "1px",
					margin: "-1px",
					position: "absolute",
					zIndex: -1,
				}}
			>
				<filter id="sharpBlur">
					<feGaussianBlur stdDeviation="2"></feGaussianBlur>
					<feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0"></feColorMatrix>
					<feComposite in2="SourceGraphic" operator="in"></feComposite>
				</filter>
			</svg>

			<div
				className={clsx(
					height,
					"relative flex flex-col justify-center rounded-lg bg-opacity-50 py-4 px-10 text-center md:py-0 md:px-24 md:text-left"
				)}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				<div
					className={clsx(
						"absolute left-0 top-0 z-[-1] min-h-full w-full rounded-lg bg-black/30 bg-cover bg-center bg-no-repeat bg-blend-multiply",
						(!page.image || page.image.length == 0) && "bg-light-500 dark:bg-dark-100"
					)}
					style={{
						backgroundImage: `url("${page.image}")`,
						filter: "url(#sharpBlur)",
					}}
				></div>
				<div className="absolute bottom-12">
					<h1 className="font-montserrat text-3xl font-bold text-light-100">{page.title}</h1>
					<p className="mb-3 text-light-300 drop-shadow">{page.description}</p>
					<div>
						<Button variant="primary" onClick={() => router.push(page.url)}>
							<div className="flex items-center space-x-2">
								<p>{page.buttonText}</p>
							</div>
						</Button>
						{page.secondaryLink && (
							<p>
								<Link href={page.secondaryLink.url} className="underline underline-offset-1">
									{page.secondaryLink.text}
								</Link>
							</p>
						)}
					</div>
				</div>
				<div className="absolute left-0 bottom-0 z-20 grid h-5 w-full place-items-center overflow-hidden">
					<div className="flex space-x-3">
						{Array(pages.length)
							.fill(0)
							.map((_, i) => (
								<div
									role={"progressbar"}
									className="h-1 w-8 cursor-pointer overflow-hidden rounded-full bg-white/40"
									onClick={() => {
										setTimePast(0);
										setPageIndex(i);
									}}
								>
									{pageIndex === i && (
										<div
											className="h-full bg-dank-300"
											style={{
												width: (timePast / duration) * 100 + "%",
											}}
										/>
									)}
								</div>
							))}
					</div>
				</div>
			</div>
		</>
	);
}
