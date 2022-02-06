import { ReactNode } from "react";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";

interface Props {
	state: any;
	callback: any;
	children: ReactNode; // Checkbox label
	className?: string;
}

export default function Checkbox({
	state,
	callback,
	children,
	className,
}: Props) {
	return (
		<div
			className={clsx(
				"mt-2 flex flex-row items-center justify-start",
				className
			)}
			onClick={callback}
		>
			<div
				className={clsx(
					!state ? "border-[#3C3C3C]" : "border-dank-300",
					"relative mr-2 h-4 w-4 rounded border-[1px] transition-colors dark:bg-black/30"
				)}
			>
				{state && (
					<Iconify
						icon="bx:bx-check"
						height="16"
						className="absolute top-[-1.5px] left-[-0.5px] text-dank-300"
					/>
				)}
			</div>
			<p className="text-xs">{children}</p>
		</div>
	);
}
