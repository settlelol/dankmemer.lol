import clsx from "clsx";
import { Card } from "src/components/store/checkout/CheckoutForm";
import { Title } from "src/components/Title";
import { toTitleCase } from "src/util/string";

interface Props {
	paymentMethod: Card;
}

export default function PaymentMethod({ paymentMethod }: Props) {
	return (
		<div className="mt-5">
			<Title size="small" className="font-semibold">
				Purchase method
			</Title>
			<div
				className={clsx(
					"mb-5 mt-1 flex select-none items-center justify-between rounded-md border-[1px] border-white/30 px-4 py-3 dark:bg-dank-500"
				)}
			>
				<div className="flex flex-row items-center justify-start">
					{paymentMethod.brand === "visa" && <img src={"/img/store/cards/visa.svg"} width={30} height={30} />}
					<p className="ml-3 text-sm">
						{toTitleCase(paymentMethod.brand)} {paymentMethod.type} card{" "}
						<span className="text-neutral-600">•</span> Ending with <code>{paymentMethod.last4}</code>
					</p>
				</div>
				<div className={clsx("text-sm", paymentMethod.expired ? "text-red-500" : "text-dank-300")}>
					{paymentMethod.expired ? "Expired" : "Expires"}:{" "}
					{("0" + paymentMethod.expiry.month).toString().slice(-2)}/
					{paymentMethod.expiry.year.toString().slice(2, 4)}
				</div>
			</div>
		</div>
	);
}
