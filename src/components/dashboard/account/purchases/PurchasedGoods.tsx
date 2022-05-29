import clsx from "clsx";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import { AggregatedDiscountData, AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
}

export default function PurchasedGoods({ purchase }: Props) {
	const [subtotal, setSubtotal] = useState(0);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		const itemsTotal = purchase.items.reduce((prev: number, curr) => prev + curr.price, 0);
		const _subtotal = itemsTotal + itemsTotal * 0.0675;
		setSubtotal(_subtotal);
		setTotal(
			_subtotal -
				_subtotal *
					(purchase.discounts.reduce((prev: number, curr) => (curr.ignore ? 0 : prev + curr.decimal), 0) /
						100 || 0)
		);
	}, [purchase.items]);

	return (
		<>
			<Title size="small" className="font-semibold">
				Goods purchased
			</Title>
			<div className="mt-2 flex flex-col space-y-3">
				{purchase.items.map((item) => (
					<div
						className="flex items-center justify-between rounded-lg px-3 py-2 dark:bg-dank-500"
						key={"items-" + item.id}
					>
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
						<p className="min-w-max">
							${item.price.toFixed(2)}
							{item.type === "recurring" && (
								<>
									{" "}
									/ {item.intervalCount! > 1 ? item.intervalCount : ""} {item.interval}
									{item.intervalCount! > 1 ? "s" : ""}
								</>
							)}
						</p>
					</div>
				))}
			</div>
			<div className="mt-2">
				{purchase.discounts.length >= 1 && (
					<>
						{purchase.discounts.length === 1 ? (
							!purchase.discounts[0].ignore && (
								<h3 className="font-montserrat text-base font-semibold">Discounts applied</h3>
							)
						) : (
							<h3 className="font-montserrat text-base font-semibold">Discount applied</h3>
						)}
						{(purchase.discounts as AggregatedDiscountData[]).map((discount) =>
							!discount.ignore ? (
								<div className="mb-1" key={discount.id}>
									<p className="text-sm dark:text-neutral-200">
										{discount.name} <span className="font-bold">-{discount.percent}</span> (-$
										{(subtotal * (discount.decimal / 100)).toFixed(2)})
									</p>
									<div className="text-sm dark:text-neutral-400">
										{discount.appliesTo.map((itemId) => {
											const prod = purchase.items.find((prod) => prod.id === itemId)!;
											return (
												<p key={prod.id}>
													{prod.quantity}x {prod.name} (-$
													{((prod.price * discount.decimal) / 100).toFixed(2)})
												</p>
											);
										})}
									</div>
								</div>
							) : (
								<></>
							)
						)}
					</>
				)}
				<div className="mt-3 w-60">
					<div className="flex w-full justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
						<Title size="small">Total:</Title>
						<Title size="small">${Math.floor(total * 100) / 100}</Title>
					</div>
				</div>
			</div>
		</>
	);
}
