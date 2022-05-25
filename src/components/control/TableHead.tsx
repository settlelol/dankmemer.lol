import clsx from "clsx";
import { MouseEventHandler, ReactNode } from "react";
import TableSortIcon, { TableHeadersState } from "./TableSortIcon";

interface Column {
	key: string | number;
	className?: string;
	rtl?: boolean;
}

export interface SortableColumn extends Column {
	type: "Sortable";
	name: ReactNode;
	content?: never;
	width: string;
	state: TableHeadersState;
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
	key,
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
			key={key}
			className={clsx(
				width,
				className,
				type === "Sortable" && "cursor-pointer",
				"bg-light-500 py-3 font-normal dark:bg-dark-100"
			)}
		>
			<p className={clsx("flex", rtl && "float-right")} onClick={onClick}>
				{content ?? name}
				{type === "Sortable" && <TableSortIcon active={active} current={state} />}
			</p>
		</th>
	);
}
