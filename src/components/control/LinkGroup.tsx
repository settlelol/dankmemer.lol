import clsx from "clsx";
import { ReactNode, useState } from "react";

interface Props {
	title: string;
	children?: ReactNode;
}

export default function LinkGroup({ title, children }: Props) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="mb-4">
			<div className="flex cursor-pointer select-none items-center" onClick={() => setCollapsed(!collapsed)}>
				<p className="font-inter font-semibold text-dark-300 dark:text-white">{title}</p>
				<div className="order-1 mx-2 ml-3 h-0.5 flex-none grow bg-[#c0c0c0] dark:bg-[#6E756F]"></div>
				<span
					className={clsx(
						"material-icons order-2 text-[#c0c0c0] transition-transform dark:text-[#6E756F]",
						collapsed ? "" : "rotate-180"
					)}
				>
					expand_more
				</span>
			</div>
			<div
				className={clsx(
					"mt-3 flex flex-col justify-start overflow-hidden transition-all duration-300",
					collapsed ? "max-h-0" : "max-h-[100vh]"
				)}
			>
				{children}
			</div>
		</div>
	);
}
