import clsx from "clsx";
import { HTMLInputTypeAttribute, ReactNode } from "react";

interface InputProps {
	width: keyof typeof inputWidths | string;
	type: HTMLInputTypeAttribute;
	placeholder: string;
	defaultValue?: string;
	label?: string | ReactNode;
	disabled?: boolean;
	className?: string;
	onChange?: any;
}

const inputWidths = {
	"extra-small": "w-14",
	small: "w-20",
	medium: "w-40",
	large: "w-[200px]",
};

export default function Input({
	width,
	type = "text",
	placeholder,
	defaultValue,
	label,
	disabled,
	className,
	onChange,
}: InputProps) {
	return (
		<div className="group flex flex-col justify-start text-black dark:text-white">
			{label && <label className="mb-1 text-neutral-300">{label}</label>}
			<input
				type={type}
				disabled={disabled}
				placeholder={placeholder}
				defaultValue={defaultValue}
				onChange={onChange}
				className={clsx(
					inputWidths[width] || width,
					className ? className : "",
					"rounded-md border-[1px] border-[#3C3C3C] px-3 py-2 font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none dark:bg-black/30"
				)}
			/>
		</div>
	);
}
