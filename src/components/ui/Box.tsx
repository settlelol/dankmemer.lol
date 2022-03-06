import clsx from "clsx";
import { ReactNode } from "react";

const sizes = {
	xs: "p-1",
	sm: "p-2",
	md: "p-4",
};

interface Props {
	size?: keyof typeof sizes;
	children: ReactNode;
	className?: string;
}

export default function Box({ size = "md", children, className }: Props) {
	return (
		<div
			className={clsx(
				"rounded-md bg-light-500 dark:bg-dark-100",
				sizes[size],
				className
			)}
		>
			{children}
		</div>
	);
}
