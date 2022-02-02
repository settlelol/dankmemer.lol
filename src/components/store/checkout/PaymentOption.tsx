import clsx from "clsx";
import { ReactNode } from "react";

interface Props {
	icons: ReactNode[];
	selected: boolean;
	select: any;
}

export default function PaymentOption({ icons, selected, select }: Props) {
	return (
		<div
			className={clsx(
				"flex justify-center items-center py-[6px] px-3 border-[1px] rounded-md cursor-pointer select-none mr-3",
				selected ? "border-dank-300" : "border-white/30"
			)}
			onClick={select}
		>
			<div
				className={clsx(
					"relative grid place-items-center mr-2 rounded-full w-3 h-3 border-2",
					selected ? "border-dank-300" : "border-white/30"
				)}
			>
				{selected && (
					<div className="absolute w-1 h-1 rounded-full bg-dank-300"></div>
				)}
			</div>
			<div className="flex">{icons}</div>
		</div>
	);
}
