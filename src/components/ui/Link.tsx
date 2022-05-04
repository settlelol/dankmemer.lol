// CL
import clsx from "clsx";
import { ReactNode } from "react";
import NextLink from "next/link";

const variantClasses = {
	primary:
		"text-dank-300 hover:text-dank-200 dark:text-dank-300 dark:hover:text-dank-200",
	regular:
		"text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100",
	secondary:
		"text-dark-100 hover:text-dank-200 dark:text-gray-300 dark:hover:text-dank-300",
};

interface Props {
	href: string;
	children: ReactNode;
	className?: string;
	variant?: keyof typeof variantClasses;
}

export default function Link({
	href,
	children,
	className,
	variant = "regular",
}: Props) {
	return (
		<NextLink href={href} passHref>
			<a
				className={clsx(
					"cursor-pointer",
					variantClasses[variant],
					className
				)}
			>
				{children}
			</a>
		</NextLink>
	);
}
