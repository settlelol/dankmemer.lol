import clsx from "clsx";
import Tooltip from "src/components/ui/Tooltip";
import { AggregatedPurchaseRecordPurchases } from "src/pages/api/customers/history";
import { Icon as Iconify } from "@iconify/react";
import { format, formatRelative } from "date-fns";
import { useState } from "react";

interface Props {
	purchase: AggregatedPurchaseRecordPurchases;
}

export default function PurchaseRow({ purchase }: Props) {
	const [subtotal] = useState(purchase.items.reduce((curr: number, item) => curr + item.price, 0));

	return (
		<tr key={purchase._id} className="group relative h-12 text-sm">
			<td className="px-5 first:rounded-l-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p className="grid h-max w-max place-items-center">
					{purchase.type === "subscription" ? (
						<Tooltip content="Subscription">
							<Iconify icon="wpf:recurring-appointment" className="text-green-500" />
						</Tooltip>
					) : (
						<Tooltip content="Single">
							<Iconify icon="akar-icons:shipping-box-01" className="text-teal-600" height={18} />
						</Tooltip>
					)}
				</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p>{purchase._id}</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p className="grid h-max w-max place-items-center px-5">
					{purchase.isGift ? (
						<Iconify icon="bi:check" className="text-green-500" height={28} />
					) : (
						<Iconify icon="charm:cross" className="text-red-500" height={24} />
					)}
				</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p className="px-5">{purchase.isGift ? <>{purchase.giftFor!}</> : <>&mdash;</>}</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p>{formatRelative(new Date(purchase.purchaseTime), new Date())}</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p className="text-right">${(subtotal + subtotal * 0.0675).toFixed(2)}</p>
			</td>
			<td className="group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<p className="text-right">{purchase.items.reduce((curr: number, item) => curr + item.quantity, 0)}</p>
			</td>
			<td className="px-5 last:rounded-r-lg group-hover:bg-neutral-100 dark:group-hover:bg-dark-100/50">
				<Iconify icon="fluent:expand-up-left-16-filled" hFlip={true} height={18} />
			</td>
		</tr>
	);
}
