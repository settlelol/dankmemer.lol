import { Icon as Iconify } from "@iconify/react";
import Checkbox from "src/components/ui/Checkbox";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Tooltip from "src/components/ui/Tooltip";
import { formatRelative } from "date-fns";
import { toTitleCase } from "src/util/string";

export interface Discount {
	id: string;
	name: string;
	code?: string | null;
	discountAmount: DiscountAmount;
	duration: Duration;
	redemptions: number;
	created: number;
	expires?: number | null;
}

interface DiscountAmount {
	percent?: number | null;
	dollars?: number | null;
}

interface Duration {
	label: string;
	months?: number | null;
}

interface Row {
	id: string;
	reverseOptions?: boolean;
	hiddenColumns?: boolean[];
}

interface SelectableRow extends Row {
	selected: boolean;
	select: any;
	deselect: any;
	showOptionsFor: any;
	showOptions: boolean;
	editProduct: any;
}

type DiscountRow = SelectableRow & Discount;

export default function DiscountRow({
	id,
	reverseOptions,
	hiddenColumns,
	name,
	code,
	discountAmount,
	duration,
	redemptions,
	created,
	expires,
	selected,
	select,
	deselect,
	showOptionsFor,
	showOptions,
	editProduct,
}: DiscountRow) {
	const options = useRef<any>(null);

	useEffect(() => {
		// I stole it from the dropdown component
		function outside(e: Event) {
			if (showOptions && !options.current!.contains(e.target)) {
				showOptionsFor("");
			}
		}

		document.addEventListener("mousedown", outside);

		return () => {
			document.removeEventListener("mousedown", outside);
		};
	}, [showOptions]);

	return (
		<>
			<tr
				key={id}
				className={clsx(
					selected ? "text-neutral-800 dark:text-neutral-300" : "dark:text-neutral-400",
					"group relative h-12 text-sm"
				)}
			>
				<td
					className={clsx(
						showOptions && "bg-neutral-100 dark:bg-dark-100/50",
						"px-5 first:rounded-l-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
					)}
				>
					<Checkbox
						className="mt-0"
						state={selected}
						style="fill"
						callback={() => (selected ? deselect() : select())}
					>
						<></>
					</Checkbox>
				</td>
				{!hiddenColumns![1] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<div className="flex items-center justify-start space-x-4">
							<p>{name}</p>
						</div>
					</td>
				)}
				{!hiddenColumns![2] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p>{code ?? <>&mdash;</>}</p>
					</td>
				)}
				{!hiddenColumns![3] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p className="w-max">
							{discountAmount.percent ? (
								<>{discountAmount.percent}% off</>
							) : discountAmount.dollars ? (
								<>${(discountAmount.dollars / 100).toFixed(2)} off</>
							) : (
								<>&mdash;</>
							)}
						</p>
					</td>
				)}
				{!hiddenColumns![4] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p>{duration.months ? <>{duration.months} months</> : toTitleCase(duration.label)}</p>
					</td>
				)}
				{!hiddenColumns![5] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p>{redemptions ?? <>&mdash;</>}</p>
					</td>
				)}
				{!hiddenColumns![6] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p>
							{created ? (
								formatRelative(new Date(created * 1000).getTime(), new Date().getTime())
							) : (
								<>&mdash;</>
							)}
						</p>
					</td>
				)}
				{!hiddenColumns![7] && (
					<td
						className={clsx(
							showOptions && "bg-neutral-100 dark:bg-dark-100/50",
							"text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
						)}
					>
						<p>
							{expires ? (
								formatRelative(new Date(expires * 1000).getTime(), new Date().getTime())
							) : (
								<>&mdash;</>
							)}
						</p>
					</td>
				)}
				<td
					className={clsx(
						showOptions && "bg-neutral-100 dark:bg-dark-100/50",
						"px-5 last:rounded-r-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50"
					)}
				>
					<Iconify
						icon="akar-icons:more-horizontal"
						height={20}
						className="cursor-pointer hover:!text-dank-100"
						onClick={() => showOptionsFor(showOptions ? "" : id)}
					/>
				</td>
				{showOptions && (
					<div
						ref={options}
						className={clsx(
							reverseOptions ? "bottom-10" : "top-10",
							"absolute right-5 z-50 h-max w-36 rounded-lg bg-light-500 px-2 py-3 dark:bg-dark-100"
						)}
					>
						<ul className="space-y-1">
							<li
								className="cursor-pointer select-none rounded-md py-2 px-2 transition-colors hover:bg-neutral-300/80  hover:dark:bg-dank-500 hover:dark:text-neutral-300"
								onClick={editProduct}
							>
								Edit details
							</li>
							<li className="cursor-pointer select-none rounded-md py-2 px-2 transition-colors hover:bg-neutral-300/80 hover:dark:bg-dank-500 hover:dark:text-neutral-300">
								<Link
									href={`https://dashboard.stripe.com/${
										process.env.NODE_ENV === "development" ? "test/" : ""
									}coupons/${id}`}
								>
									<a target={"_blank"}>View on Stripe</a>
								</Link>
							</li>
						</ul>
					</div>
				)}
			</tr>
		</>
	);
}
