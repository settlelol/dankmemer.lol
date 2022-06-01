import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import Head from "./Head";

interface FilterableColumnData {
	type: "Sortable";
	name: string;
	// Instead of using this, create an array of "Sortable" columns and get the index of the clicked one
	content?: never;
	width: string;
	rtl?: boolean;
	hidden: boolean;
}

interface UnfilterableColumnData {
	type: "Unsortable";
	name?: never;
	selector?: never;
	content: ReactNode;
	width: string;
	hidden: boolean;
}

export enum SortingState {
	ASCENDING = 0,
	DESCENDING = 1,
}

export type ColumnData = FilterableColumnData | UnfilterableColumnData;

interface Props {
	heads: ColumnData[];
	sort(selector: number, state: SortingState): void;
	body: ReactNode;
}

export default function Table({ heads, sort, body }: Props) {
	const sortableHeads = useRef(heads.filter((head) => head.type === "Sortable"));
	const [sortedColumn, setSortedColumn] = useState<number>();
	const [sortingState, setSortingState] = useState<SortingState>(SortingState.DESCENDING);

	useEffect(() => {
		console.log(sortedColumn);
	}, [sortedColumn]);

	return (
		<table
			style={{ borderSpacing: "0 0.3rem" }}
			className="relative mt-4 w-full border-separate overflow-hidden rounded-lg border-none text-left text-neutral-600 dark:text-neutral-300"
		>
			<thead>
				<tr>
					{heads.map((head, i) => {
						const selector: number | null =
							head.type === "Sortable"
								? sortableHeads.current.findIndex((el) => el.name === head.name)
								: null;

						if (!head.hidden && head.type === "Sortable") {
							return (
								<Head
									key={i}
									type={head.type}
									name={head.name}
									width={head.width}
									state={sortingState}
									active={sortedColumn === selector}
									rtl={head.rtl}
									className={clsx(i === 0 && "rounded-l-lg", i === heads.length && "rounded-r-lg")}
									onClick={() => {
										setSortedColumn(selector!);
										setSortingState(+!sortingState);
										sort(selector!, +!sortingState);
									}}
								/>
							);
						} else {
							return (
								<Head
									key={i}
									className={clsx(
										i === 0 && "rounded-l-lg",
										i === heads.length - 1 && "rounded-r-lg",
										"px-5"
									)}
									type={"Unsortable"}
									content={head.content}
									width={head.width}
								/>
							);
						}
					})}
				</tr>
			</thead>
			{/* Required to add additional spacing between the thead and tbody elements */}
			<div className="h-4" />
			<tbody>{body}</tbody>
		</table>
	);
}
