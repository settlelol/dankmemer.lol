import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";
import { SortingState } from ".";
import TableSortIcon from "./SortIcon";

interface Column {
	className?: string;
	rtl?: boolean;
}

export interface SortableColumn extends Column {
	type: "Sortable";
	name: ReactNode;
	content?: never;
	width: string;
	state: "desc" | "asc";
	active: boolean;
	onClick: MouseEventHandler<HTMLParagraphElement>;
}

export interface UnsortableColumn extends Column {
	type: "Unsortable";
	name?: never;
	content: ReactNode;
	width: string;
	state?: never;
	active?: never;
	onClick?: never;
}

type TableHeadProps = SortableColumn | UnsortableColumn;

export default function TableHead({
	type,
	width,
	name,
	content,
	state,
	active,
	className,
	rtl,
	onClick,
}: TableHeadProps) {
	return (
		<th
			className={clsx(
				width,
				className,
				type === "Sortable" && "cursor-pointer",
				"bg-light-500 py-3 font-normal dark:bg-dark-100"
			)}
		>
			<p
				className={clsx("flex select-none items-center justify-start space-x-1", rtl && "float-right -mr-2")}
				onClick={onClick}
			>
				<span>{content ?? name}</span>
				{type === "Sortable" && <TableSortIcon active={active} current={state} />}
			</p>
		</th>
	);
}
