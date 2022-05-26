import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";

export enum TableHeadersState {
	TOP = 0,
	BOTTOM = 1,
}

interface Props {
	active: boolean;
	current?: TableHeadersState;
}

export default function TableSortIcon({ active, current }: Props) {
	return (
		<div className="ml-3 grid place-items-center">
			<Iconify
				icon="carbon:chevron-sort-up"
				className={clsx(
					"absolute",
					active && current === TableHeadersState.TOP ? "text-black dark:text-white" : "dark:text-neutral-500"
				)}
			/>
			<Iconify
				icon="carbon:chevron-sort-down"
				className={clsx(
					"absolute",
					active && current === TableHeadersState.BOTTOM
						? "text-black dark:text-white"
						: "dark:text-neutral-500"
				)}
			/>
		</div>
	);
}
