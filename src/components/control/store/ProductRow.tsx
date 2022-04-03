import { Icon as Iconify } from "@iconify/react";
import Checkbox from "src/components/ui/Checkbox";
import clsx from "clsx";

interface ProductRow {
	id: string;
	name: string;
	image: string;
	price: string;
	lastUpdated: string;
	sales: number | string;
	selected: boolean;
	select: any;
	deselect: any;
}

export default function ProductRow({
	id,
	name,
	image,
	price,
	lastUpdated,
	sales,
	selected,
	select,
	deselect,
}: ProductRow) {
	return (
		<tr
			key={id}
			className={clsx(
				selected
					? "text-neutral-800 dark:text-neutral-300"
					: "dark:text-neutral-400",
				"group"
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
			<td className="text-sm group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p>{price}</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p>{lastUpdated}</p>
			</td>
			<td className="text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p>{sales}</p>
			</td>
			<td className="text-right group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				${(102938).toLocaleString()}
			</td>
			<td className="px-5 last:rounded-r-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<Iconify
					icon="akar-icons:more-horizontal"
					height={20}
					className="cursor-pointer hover:!text-dank-100"
					// onClick={() => selectProduct(product.id)}
				/>
			</td>
		</tr>
	);
}
