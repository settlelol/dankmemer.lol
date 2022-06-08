import clsx from "clsx";
import { MouseEventHandler } from "react";

interface Props {
	checked: boolean;
	variant: "normal" | "danger";
	onClick: MouseEventHandler<HTMLLabelElement>;
}

export default function Switch({ checked, variant, onClick }: Props) {
	return (
		<>
			<input className="invisible h-0 w-0" name="switch" type="checkbox" />
			<label
				className={clsx(
					checked && variant !== "danger" && "!bg-green-500 dark:!bg-green-500",
					checked && variant === "danger" && "!bg-red-500 dark:!bg-red-500",
					"relative flex h-6 w-11 cursor-pointer items-center justify-between rounded-full bg-slate-200 transition-colors dark:bg-neutral-700"
				)}
				htmlFor="switch"
				onClick={onClick}
			>
				<span
					className={clsx(
						checked && "right-2 translate-x-full",
						"absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md duration-200"
					)}
				/>
			</label>
		</>
	);
}
