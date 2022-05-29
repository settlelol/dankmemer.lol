import clsx from "clsx";
import { ReactNode } from "react";

const sizes = {
	xsmall: "text-lg",
	small: "text-xl",
	medium: "text-2xl",
	big: "text-3xl",
} as const;

interface Props {
	size: keyof typeof sizes;
	children: ReactNode;
	className?: string;
}

export function Title({ size, children, className }: Props) {
	return (
		<h1 className={clsx("font-montserrat font-bold text-dank-300 dark:text-light-100", sizes[size], className)}>
			{children}
		</h1>
	);
}
