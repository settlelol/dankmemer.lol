import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { toTitleCase } from "src/util/string";
import { RequireAllOrNone } from "type-fest";
import { CardData } from "./checkout/CheckoutForm";

interface Props {
	paymentMethod: CardData;
	className?: string;
	select?: (id: string) => void;
	selected?: boolean;
	isDefault?: boolean;
}

export default function PaymentMethod({
	paymentMethod,
	className,
	select,
	selected,
	isDefault,
}: RequireAllOrNone<Props, "select" | "selected">): JSX.Element {
	const [selectable] = useState(select !== undefined && selected !== undefined);
	return (
		<div
			className={clsx(
				"mt-1 flex select-none items-center justify-between rounded-md border-[1px] border-black/40 px-4 py-3 dark:border-white/30 dark:bg-dank-500",
				selectable ? "border-dank-300" : "border-white/30",
				className
			)}
			{...(select !== undefined && {
				onClick: () => select(paymentMethod.id),
			})}
		>
			<div className="flex flex-row items-center justify-start">
				{selectable && (
					<div
						className={clsx(
							"relative mr-2 grid h-3 min-w-[0.75rem] place-items-center rounded-full border-2",
							selected ? "border-dank-300" : "border-black/30 dark:border-white/30"
						)}
					>
						{selected && <div className="absolute h-1 w-1 rounded-full bg-dank-300"></div>}
					</div>
				)}
				{paymentMethod.card.brand === "visa" && (
					<Image src={"/img/store/cards/visa.svg"} width={30} height={30} />
				)}
				{paymentMethod.card.brand === "mastercard" && (
					<Image src={"/img/store/cards/mastercard.svg"} width={30} height={30} />
				)}
				{paymentMethod.card.brand === "discover" && (
					<Image src={"/img/store/cards/discover.svg"} width={30} height={30} />
				)}
				{paymentMethod.card.brand === "amex" && (
					<Image src={"/img/store/cards/amex.svg"} width={30} height={30} />
				)}
				<p className="ml-3 text-sm text-black dark:text-white">
					{toTitleCase(paymentMethod.card.brand)} {paymentMethod.card.type} card{" "}
					<span className="text-neutral-600">•</span> Ending with <code>{paymentMethod.card.last4}</code>
				</p>
				{isDefault && (
					<p className="ml-2 grid h-4 w-max place-items-center rounded bg-dank-300 px-1 text-xs">DEFAULT</p>
				)}
			</div>
			<div className={clsx("text-sm", paymentMethod.card.expired ? "text-red-500" : "text-dank-300")}>
				{paymentMethod.card.expired ? "Expired" : "Expires"}:{" "}
				{("0" + paymentMethod.card.expiry.month).toString().slice(-2)}/
				{paymentMethod.card.expiry.year.toString().slice(2, 4)}
			</div>
		</div>
	);
}
