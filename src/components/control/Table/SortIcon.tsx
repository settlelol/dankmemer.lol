import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";

interface Props {
	active?: boolean;
	current?: "asc" | "desc";
}

export default function TableSortIcon({ active, current }: Props) {
	return (
		<div className="grid h-4 w-4 place-items-center">
			<Iconify
				icon="carbon:chevron-sort-up"
				className={clsx(
					"absolute",
					active && current === "asc" ? "text-black dark:text-white" : "dark:text-neutral-500"
				)}
			/>
			<Iconify
				icon="carbon:chevron-sort-down"
				className={clsx(
					"absolute",
					active && current === "desc" ? "text-black dark:text-white" : "dark:text-neutral-500"
				)}
			/>
		</div>
	);
}
