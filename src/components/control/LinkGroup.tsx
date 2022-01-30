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
			<div
				className="flex items-center cursor-pointer select-none"
				onClick={() => setCollapsed(!collapsed)}
			>
				<p className="font-inter font-semibold text-dark-300 dark:text-white">
					{title}
				</p>
				<div className="flex-none order-1 grow mx-2 ml-3 bg-[#c0c0c0] dark:bg-[#6E756F] h-[2px]"></div>
				<span
					className={clsx(
						"order-2 material-icons text-[#c0c0c0] dark:text-[#6E756F] transition-transform",
						collapsed ? "" : "rotate-180"
					)}
				>
					expand_more
				</span>
			</div>
			<div
				className={clsx(
					"flex justify-start flex-col mt-3 overflow-hidden transition-all duration-300",
					collapsed ? "max-h-0" : "max-h-[100vh]"
				)}
			>
				{children}
			</div>
		</div>
	);
}
