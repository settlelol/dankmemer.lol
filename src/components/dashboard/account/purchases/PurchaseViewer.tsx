import clsx from "clsx";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
}

export default function PurchaseViewer({ purchase }: Props) {
	const [subtotal, setSubtotal] = useState(0);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		const itemsTotal = purchase.items.reduce((prev: number, curr) => prev + curr.price, 0);
		const _subtotal = itemsTotal + itemsTotal * 0.0675;
		setSubtotal(_subtotal);
		setTotal(
			_subtotal - _subtotal * (purchase.discounts.reduce((prev: number, curr) => prev + curr.decimal, 0) / 100)
		);
	}, [purchase.items]);

	return (
		<div>
			<Title size="big">Viewing order</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				In-depth details on a previous order that you have placed.
			</p>
			<div className="mt-3">
				<Title size="small">Goods purchased</Title>
				<div className="mt-2 flex flex-col space-y-3">
					{purchase.items.map((item) => (
						<div className="flex items-center justify-between rounded-lg px-3 py-2 dark:bg-dank-500">
							<div className="flex w-full items-center justify-start space-x-4">
								<div
									className={clsx(
										"rounded-md bg-black/10 bg-light-500 bg-center bg-no-repeat dark:bg-dark-200",
										"h-12 w-12 bg-[length:33px_33px]"
									)}
									style={{
										backgroundImage: `url('${item.image}')`,
									}}
								/>
								<span>
									{item.quantity}x {item.name}
								</span>
							</div>
							<p>${item.price.toFixed(2)}</p>
						</div>
					))}
				</div>
				<div className="mt-2 text-right">
					<p>Discounts applied</p>
					{purchase.discounts.map((discount) => (
						<p>
							{discount.name} -{discount.percent} (-${(subtotal * (discount.decimal / 100)).toFixed(2)})
						</p>
					))}
					<p>Total: ${Math.floor(total * 100) / 100}</p>
				</div>
			</div>
		</div>
	);
}
