import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { SortingState } from ".";

interface Props {
	active: boolean;
	current?: SortingState;
}

export default function TableSortIcon({ active, current }: Props) {
	return (
		<div className="ml-3 grid place-items-center">
			<Iconify
				icon="carbon:chevron-sort-up"
				className={clsx(
					"absolute",
					active && current === SortingState.ASCENDING
						? "text-black dark:text-white"
						: "dark:text-neutral-500"
				)}
			/>
			<Iconify
				icon="carbon:chevron-sort-down"
				className={clsx(
					"absolute",
					active && current === SortingState.DESCENDING
						? "text-black dark:text-white"
						: "dark:text-neutral-500"
				)}
			/>
		</div>
	);
}
