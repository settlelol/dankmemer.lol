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
}

export function Title({ size, children }: Props) {
	return (
		<h1
			className={clsx(
				"font-montserrat font-bold text-dank-300 dark:text-light-100",
				sizes[size]
			)}
		>
			{children}
		</h1>
	);
}
