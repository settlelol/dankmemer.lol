import clsx from "clsx";
import { Dispatch, SetStateAction } from "react";
import { Box } from "../../types";

const BOX_COLORS = ["border-white", "border-dank-300", "border-yellow-400"];

interface Props {
	data: Box;
	active: boolean;
	boxCount: number;
	setActiveBox: Dispatch<SetStateAction<Box>>;
	setBoxCount: Dispatch<SetStateAction<number>>;
}

export function BoxOption({
	data,
	active,
	setActiveBox,
	setBoxCount,
	boxCount,
}: Props) {
	return (
		<div
			className={clsx(
				"relative flex h-full cursor-pointer flex-col items-center border-2 bg-light-500 px-20 pt-14 pb-3 shadow-2xl dark:bg-dark-500",
				active
					? BOX_COLORS[data.id]
					: "border-light-500 dark:border-dark-500"
			)}
			onClick={() => {
				setActiveBox(data);
			}}
		>
			<div className="font-montserrat text-3xl font-bold text-dark-500 dark:text-white">
				{data.name.toUpperCase()}
			</div>
			<div className="font-montserrat text-2xl font-bold text-dank-300">
				${data.price}
			</div>
			{active && (
				<div className="flex items-center justify-center text-dark-500 dark:text-white">
					<div
						className="select-none p-1 font-bold"
						onClick={(e) => {
							setBoxCount(boxCount - 1);
							e.stopPropagation();
						}}
					>
						-
					</div>
					<input
						className="w-12 resize-none overflow-hidden border-none bg-transparent text-center outline-none"
						placeholder="Boxes"
						onChange={(e) =>
							setBoxCount(parseFloat(e.target.value))
						}
						value={boxCount}
					/>
					<div
						className="select-none p-1 font-bold"
						onClick={(e) => {
							setBoxCount(boxCount + 1);
							e.stopPropagation();
						}}
					>
						+
					</div>
				</div>
			)}
		</div>
	);
}
