import clsx from "clsx";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
	name: string;
	description?: string;
	expandedIds?: string[];
	fields: Record<string, string>;
	setExpandedIds?: Dispatch<SetStateAction<string[]>>;
}

export default function Expandable({
	name,
	description,
	fields,
	setExpandedIds,
	expandedIds,
}: Props) {
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		if (setExpandedIds) {
			if (expanded) {
				setExpandedIds([...expandedIds!, name]);
			} else {
				setExpandedIds([...expandedIds!.filter((id) => id !== name)]);
			}
		}
	}, [expanded]);

	useEffect(() => {
		if (!expandedIds?.includes(name)) {
			setExpanded(false);
		}
	}, [expandedIds]);

	return (
		<div
			className={clsx(
				"select-none rounded-md border bg-light-400 p-4 dark:bg-dark-500",
				expanded
					? "border-dank-300"
					: "bg-light-400 dark:border-dark-500"
			)}
			onClick={() => setExpanded(!expanded)}
		>
			<div>
				<div className="text-lg text-dank-200 dark:text-white">
					{name}
				</div>
				{description && (
					<div className="text-sm text-light-600 dark:text-gray-400">
						{description}
					</div>
				)}
				<div
					className={clsx(
						"mt-2 flex flex-col space-y-3 border-t-2 pt-2 dark:border-dark-200",
						expanded ? "visible opacity-100" : "hidden opacity-0"
					)}
				>
					{Object.entries(fields).map(([title, content]) => (
						<div>
							<div className="text-sm text-dank-200 dark:text-white">
								{title}
							</div>
							<div className="text-sm text-light-600 dark:text-gray-400">
								{content}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
