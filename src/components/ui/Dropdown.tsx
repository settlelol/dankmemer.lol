import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

const optionVariants = {
	normal: "text-neutral-300",
	danger: "text-red-500",
};

export interface Option {
	label: string | ReactNode;
	link?: string;
	icon?: string;
	variant?: keyof typeof optionVariants;
	onClick?: (e: any) => void;
}

interface Props {
	content: ReactNode;
	options: Array<Option | null>;
	className?: string;
	isInput?: boolean;
	requireScroll?: boolean;
	reverseOptions?: boolean;
	maxOptionsHeight?: string;
}

export default function Dropdown({
	content,
	options,
	className = "",
	isInput = false,
	requireScroll = false,
	reverseOptions = false,
	maxOptionsHeight = "max-h-72",
}: Props) {
	const [open, setOpen] = useState(false);
	const dropdown = useRef<any>(null);

	useEffect(() => {
		function outside(event: Event) {
			if (!dropdown.current!.contains(event.target)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", outside);

		return () => {
			document.removeEventListener("mousedown", outside);
		};
	}, [dropdown]);

	useEffect(() => {
		function handleResize() {
			setOpen(false);
		}

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<div className={clsx("relative cursor-pointer select-none", className)} ref={dropdown}>
			<div
				className={clsx(
					isInput ? "bg-light-200 dark:bg-dank-600" : "bg-light-500 dark:bg-dank-500",
					"flex items-center rounded-md"
				)}
				onClick={() => setOpen(!open)}
			>
				{content}
			</div>
			{open &&
				(requireScroll ? (
					<div className={clsx("absolute z-50 min-h-full w-full", reverseOptions ? "bottom-11" : "mt-2")}>
						<SimpleBar className={maxOptionsHeight}>
							<div
								className={clsx("flex flex-col space-y-1 overflow-y-auto rounded-md bg-[#18191c] p-2")}
								onClick={() => setOpen(false)}
							>
								{options
									.filter((o) => o)
									.map((option) => {
										const content = (
											<div
												onClick={(e) => (option?.onClick ? option?.onClick(e) : null)}
												className={clsx(
													"rounded-sm px-2 py-1 text-sm hover:bg-[#131417]",
													optionVariants[option?.variant || "normal"]
												)}
											>
												<div className="flex items-center space-x-2">
													{option?.icon && (
														<div className="material-icons" style={{ fontSize: "16px" }}>
															{option.icon}
														</div>
													)}
													<div>{option?.label}</div>
												</div>
											</div>
										);

										return option?.link ? (
											<Link href={option?.link || "#"}>{content}</Link>
										) : (
											content
										);
									})}
							</div>
						</SimpleBar>
					</div>
				) : (
					<div className="absolute z-50 mt-2 min-h-full w-full">
						<div
							className={clsx("flex flex-col space-y-1 rounded-md bg-[#18191c] p-2", maxOptionsHeight)}
							onClick={() => setOpen(false)}
						>
							{options
								.filter((o) => o)
								.map((option) => {
									const content = (
										<div
											onClick={(e) => (option?.onClick ? option?.onClick(e) : null)}
											className={clsx(
												"rounded-sm px-2 py-1 text-sm hover:bg-[#131417]",
												optionVariants[option?.variant || "normal"]
											)}
										>
											<div className="flex items-center space-x-2">
												{option?.icon && (
													<div className="material-icons" style={{ fontSize: "16px" }}>
														{option.icon}
													</div>
												)}
												<div>{option?.label}</div>
											</div>
										</div>
									);

									return option?.link ? <Link href={option?.link || "#"}>{content}</Link> : content;
								})}
						</div>
					</div>
				))}
		</div>
	);
}
