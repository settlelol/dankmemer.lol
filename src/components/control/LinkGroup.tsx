import clsx from "clsx";
import { ReactNode, useState } from "react";

interface Props {
	title: string;
	children?: ReactNode;
	nomb?: boolean;
}

export default function LinkGroup({ title, children, nomb }: Props) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className={clsx(!nomb && "mb-4")}>
			<div
				className="grid cursor-pointer select-none place-items-center items-center xl:flex"
				onClick={() => setCollapsed(!collapsed)}
			>
				<p className="hidden font-inter font-semibold text-dark-300 dark:text-white xl:block">{title}</p>
				<div className="order-1 mx-2 ml-3 hidden h-0.5 flex-none grow bg-neutral-300 dark:bg-neutral-500 xl:flex"></div>
				<span
					className={clsx(
						"material-icons order-2 w-10 rounded-md bg-dank-600 text-center text-neutral-300 transition-transform dark:text-neutral-500 xl:w-auto xl:bg-transparent",
						collapsed ? "" : "rotate-180"
					)}
				>
					expand_more
				</span>
			</div>
			<div
				className={clsx(
					"mt-3 flex flex-col justify-center overflow-hidden transition-all duration-300 xl:justify-start",
					collapsed ? "max-h-0" : "max-h-[100vh]"
				)}
			>
				{children}
			</div>
		</div>
	);
}
