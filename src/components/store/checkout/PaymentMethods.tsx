import clsx from "clsx";
import Visa from "public/img/store/cards/Visa.svg";
import { toTitleCase } from "src/util/string";
import { CardData } from "./CheckoutForm";

interface Props {
	savedPaymentMethods: CardData[] | undefined;
	defaultPaymentMethod: CardData | undefined;
	select: any;
	selected: string;
}

export default function PaymentMethods({
	savedPaymentMethods,
	defaultPaymentMethod,
	select,
	selected,
}: Props) {
	return (
		<div className="mt-5">
			<h3 className="font-montserrat text-base font-bold">
				Your saved payment methods
			</h3>
			<p className="w-2/3 text-sm text-neutral-300">
				Below are a list of previously used payment methods you have
				opted for us to save. Select one to use it again.
			</p>
			<div className="mt-3 flex flex-col">
				{defaultPaymentMethod && (
					<div
						className={clsx(
							"mb-5 flex cursor-pointer select-none items-center justify-between rounded-md border-[1px] px-4 py-3 dark:bg-dank-500",
							selected === defaultPaymentMethod.id
								? "border-dank-300"
								: "border-white/30"
						)}
						onClick={() => select(defaultPaymentMethod.id)}
					>
						<div className="flex flex-row items-center justify-start">
							<div
								className={clsx(
									"relative mr-2 grid h-3 min-w-[0.75rem] place-items-center rounded-full border-2",
									selected === defaultPaymentMethod.id
										? "border-dank-300"
										: "border-white/30"
								)}
							>
								{selected === defaultPaymentMethod.id && (
									<div className="absolute h-1 w-1 rounded-full bg-dank-300"></div>
								)}
							</div>
							{defaultPaymentMethod.card.brand === "visa" && (
								<Visa width={30} height={30} />
							)}
							<p className="ml-3 text-sm">
								{toTitleCase(defaultPaymentMethod.card.brand)}{" "}
								{defaultPaymentMethod.card.type} card{" "}
								<span className="text-neutral-600">•</span>{" "}
								Ending with{" "}
								<code>{defaultPaymentMethod.card.last4}</code>
							</p>
						</div>
						<div
							className={clsx(
								"text-sm",
								defaultPaymentMethod.card.expired
									? "text-red-500"
									: "text-dank-300"
							)}
						>
							{defaultPaymentMethod.card.expired
								? "Expired"
								: "Expires"}
							:{" "}
							{("0" + defaultPaymentMethod.card.expiry.month)
								.toString()
								.slice(-2)}
							/
							{defaultPaymentMethod.card.expiry.year
								.toString()
								.slice(2, 4)}
						</div>
					</div>
				)}
				{savedPaymentMethods &&
					savedPaymentMethods.map(({ id, card }) => (
						<div
							className={clsx(
								"mb-5 flex cursor-pointer select-none items-center justify-between rounded-md border-[1px] px-4 py-3 dark:bg-dank-500",
								selected === id
									? "border-dank-300"
									: "border-white/30"
							)}
							onClick={() => select(id)}
						>
							<div className="flex flex-row items-center justify-start">
								<div
									className={clsx(
										"relative mr-2 grid h-3 min-w-[0.75rem] place-items-center rounded-full border-2",
										selected === id
											? "border-dank-300"
											: "border-white/30"
									)}
								>
									{selected === id && (
										<div className="absolute h-1 w-1 rounded-full bg-dank-300"></div>
									)}
								</div>
								{card.brand === "visa" && (
									<Visa width={30} height={30} />
								)}
								<p className="ml-3 text-sm">
									{toTitleCase(card.brand)} {card.type} card{" "}
									<span className="text-neutral-600">•</span>{" "}
									Ending with <code>{card.last4}</code>
								</p>
							</div>
							<div
								className={clsx(
									"text-sm",
									card.expired
										? "text-red-500"
										: "text-dank-300"
								)}
							>
								{card.expired ? "Expired" : "Expires"}:{" "}
								{("0" + card.expiry.month).toString().slice(-2)}
								/{card.expiry.year.toString().slice(2, 4)}
							</div>
						</div>
					))}
			</div>
		</div>
	);
}
