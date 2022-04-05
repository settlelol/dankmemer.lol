import { Icon as Iconify } from "@iconify/react";
import Checkbox from "src/components/ui/Checkbox";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface ProductRow {
	id: string;
	name: string;
	image: string;
	price: string;
	lastUpdated: string;
	sales: number;
	revenue: number;
	selected: boolean;
	select: any;
	deselect: any;
	showOptionsFor: any;
	showOptions: boolean;
	editProduct: any;
}

export default function ProductRow({
	id,
	name,
	image,
	price,
	lastUpdated,
	sales,
	revenue,
	selected,
	select,
	deselect,
	showOptionsFor,
	showOptions,
	editProduct,
}: ProductRow) {
	const options = useRef<any>(null);

	useEffect(() => {
		// I stole it from the dropdown component
		function outside(e: Event) {
			if (showOptions && !options.current!.contains(e.target)) {
				showOptionsFor("");
			}
		}

		document.addEventListener("mousedown", outside);

		return () => {
			document.removeEventListener("mousedown", outside);
		};
	}, [showOptions]);

	return (
		<>
			<tr
				key={id}
				className={clsx(
					selected
						? "text-neutral-800 dark:text-neutral-300"
						: "dark:text-neutral-400",
					"group relative text-sm"
				)}
			>
				<td className="px-5 first:rounded-l-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<Checkbox
						className="mt-0"
						state={selected}
						style="fill"
						callback={() => (selected ? deselect() : select())}
					>
						<></>
					</Checkbox>
				</td>
				<td className="py-1 group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<div className="flex items-center justify-start space-x-4">
						<div
							className={clsx(
								"rounded-md bg-black/10 bg-light-500 bg-center bg-no-repeat dark:bg-dark-100",
								"h-12 w-12 bg-[length:33px_33px]"
							)}
							style={{
								backgroundImage: `url('${image}')`,
							}}
						/>
						<span>{name}</span>
					</div>
				</td>
				<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<p>{price}</p>
				</td>
				<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<p>{lastUpdated}</p>
				</td>
				<td className="text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<p>{sales ?? <>&mdash;</>}</p>
				</td>
				<td className="text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<p>
						$
						{revenue ? revenue.toFixed(2).toLocaleString() : "0.00"}
					</p>
				</td>
				<td className="px-5 last:rounded-r-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
					<Iconify
						icon="akar-icons:more-horizontal"
						height={20}
						className="cursor-pointer hover:!text-dank-100"
						onClick={() => showOptionsFor(showOptions ? "" : id)}
					/>
				</td>
				{showOptions && (
					<div
						ref={options}
						className="absolute top-10 right-5 z-50 h-max w-36 rounded-lg bg-light-500 px-2 py-3 dark:bg-dark-100"
					>
						<ul className="space-y-1">
							<li
								className="cursor-pointer select-none rounded-md py-2 px-2 transition-colors hover:dark:bg-dank-500 hover:dark:text-neutral-300"
								onClick={editProduct}
							>
								Edit details
							</li>
							<li className="cursor-pointer select-none rounded-md py-2 px-2 transition-colors hover:dark:bg-dank-500 hover:dark:text-neutral-300">
								Archive
							</li>
						</ul>
					</div>
				)}
			</tr>
		</>
	);
}
