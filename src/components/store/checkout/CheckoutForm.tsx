import {
	CardCvcElement,
	CardExpiryElement,
	CardNumberElement,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import {
	StripeCardCvcElementChangeEvent,
	StripeCardExpiryElementChangeEvent,
	StripeCardNumberElementChangeEvent,
} from "@stripe/stripe-js";
import axios from "axios";
import clsx from "clsx";
import Amex from "public/img/store/cards/Amex.svg";
import Discover from "public/img/store/cards/Discover.svg";
import Mastercard from "public/img/store/cards/Mastercard.svg";
import Visa from "public/img/store/cards/Visa.svg";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { CartItem } from "src/pages/store";
import { DiscountItem } from "src/pages/store/checkout";
import Input from "../Input";
import PaymentOption from "./PaymentOption";
import Link from "next/link";

import { Icon as Iconify } from "@iconify/react";

interface Props {
	clientSecret: string;
	paymentIntentId: string;
	userEmail: string;
	subtotalCost: number;
	cart: CartItem[];
}

export default function CheckoutForm({
	clientSecret,
	paymentIntentId,
	userEmail,
	subtotalCost,
	cart,
}: Props) {
	const [totalCost, setTotalCost] = useState<number>(0);

	const [selectedPaymentOption, setSelectedPaymentOption] = useState("Card");

	const [nameOnCard, setNameOnCard] = useState("");
	const stripe = useStripe();
	const stripeElements = useElements();

	// Stripe input states
	const [cardNumberInput, setCardNumberInput] =
		useState<StripeCardNumberElementChangeEvent>();
	const [cardExpiryInput, setCardExpiryInput] =
		useState<StripeCardExpiryElementChangeEvent>();
	const [cardCvcInput, setCardCvcInput] =
		useState<StripeCardCvcElementChangeEvent>();

	const [discountError, setDiscountError] = useState("");
	const [discountInput, setDiscountInput] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	const [purchaseIsGift, setPurchaseIsGift] = useState(false);
	const [receiptEmail, setReceiptEmail] = useState(userEmail);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	const [canCheckout, setCanCheckout] = useState(false);

	useEffect(() => {
		setTotalCost(subtotalCost - appliedSavings);
	}, [subtotalCost, appliedSavings]);

	useEffect(() => {
		if (
			nameOnCard.length >= 1 &&
			cardNumberInput?.complete &&
			cardExpiryInput?.complete &&
			cardCvcInput?.complete &&
			receiptEmail.length >= 5 &&
			acceptedTerms
		)
			setCanCheckout(true);
		else setCanCheckout(false);
	}, [
		nameOnCard,
		cardNumberInput,
		cardExpiryInput,
		cardCvcInput,
		receiptEmail,
		acceptedTerms,
	]);

	useEffect(() => {
		if (discountError.length > 1) return setDiscountError("");
	}, [discountInput]);

	const submitDiscountCode = () => {
		if (discountInput.length < 1) return;
		axios(`/api/store/discounts/get?code=${discountInput}`)
			.then(({ data }) => {
				setAppliedDiscount(true);
				setDiscountedItems(data.discountedItems);
				setAppliedSavings(data.totalSavings);
			})
			.catch((e) => {
				console.error(e);
				switch (e.response.status) {
					case 404:
						setDiscountError("Invalid discount code provided.");
						break;
					case 410:
						setDiscountError("Discount code has expired.");
					case 403:
						setDiscountError("Minimum cart value not met.");
					default:
						console.log(
							`Unhandled discount error code: ${e.response.status}`
						);
				}
			});
	};

	const confirmPayment = async () => {
		if (!stripe || !stripeElements || !canCheckout) return;
		const result = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: stripeElements.getElement("cardNumber")!,
			},
		});
		if (result.error) {
			alert("SOMETHING WENT WRONG OH NO!!!!!!!!!");
			console.error(result.error);
		} else {
			alert("Payment was a success, pogchamp");
		}
	};

	return (
		<div className="relative h-[587px] min-w-[58.33%]">
			<div className="h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
				<div className="mb-4">
					<Title size="small">Payment Method</Title>
					<div className="mt-3 flex justify-start">
						<PaymentOption
							icons={[
								<Visa key="visa" className="mr-1" />,
								<Mastercard
									key="mastercard"
									className="mr-1"
								/>,
								<Amex key="amex" className="mr-1" />,
								<Discover key="discover" />,
							]}
							selected={selectedPaymentOption === "Card"}
							select={() => setSelectedPaymentOption("Card")}
						/>
						<PaymentOption
							icons={[
								<img
									key="paypal"
									src="/img/store/PayPal.png"
									width={70}
								/>,
							]}
							selected={selectedPaymentOption === "PayPal"}
							select={() => setSelectedPaymentOption("PayPal")}
						/>
					</div>
				</div>
				{selectedPaymentOption === "Card" ? (
					<div className="mt-9 flex items-center justify-start overflow-hidden">
						<div>
							<Input
								width="large"
								type="text"
								label="Name on card"
								defaultValue={nameOnCard}
								onChange={(e: any) =>
									setNameOnCard(e.target.value)
								}
								placeholder="John doe"
							/>
							<div className="mt-2 flex items-center justify-start">
								<div className="mr-7 w-48">
									<label>Card number</label>
									<CardNumberElement
										onChange={(data) =>
											setCardNumberInput(data)
										}
										options={{
											placeholder: "4024 0071 1411 4951",
											style: {
												base: {
													color: "#ffffff",
													fontFamily:
														"Inter, sans-serif",
													fontWeight: "400",
													fontSize: "14px",
													"::placeholder": {
														color: "#9ca3af",
													},
												},
											},
											classes: {
												base: "mt-1 w-[200px] px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
												focus: "border-[#199532] outline-none",
												invalid: "border-[#F84A4A]",
											},
										}}
									/>
								</div>
								<div className="mr-5 w-max">
									<label>Expiry</label>
									<div className="w-20">
										<CardExpiryElement
											onChange={(data) =>
												setCardExpiryInput(data)
											}
											options={{
												placeholder: "04 / 25",
												style: {
													base: {
														color: "#ffffff",
														fontFamily:
															"Inter, sans-serif",
														fontWeight: "400",
														fontSize: "14px",
														"::placeholder": {
															color: "#9ca3af",
														},
													},
												},
												classes: {
													base: "mt-1 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
													focus: "border-[#199532]",
													invalid: "border-[#F84A4A]",
												},
											}}
										/>
									</div>
								</div>
								<div className="w-max">
									<label>CVC</label>
									<div className="w-14">
										<CardCvcElement
											onChange={(data) =>
												setCardCvcInput(data)
											}
											options={{
												placeholder: "964",
												style: {
													base: {
														color: "#ffffff",
														fontFamily:
															"Inter, sans-serif",
														fontWeight: "400",
														fontSize: "14px",
														"::placeholder": {
															color: "#9ca3af",
														},
													},
												},
												classes: {
													base: "mt-1 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
													focus: "border-[#199532]",
													invalid: "border-[#F84A4A]",
												},
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					""
				)}
				<div className="mt-9 flex items-start justify-items-start">
					<div className="mr-9 min-h-[200px]">
						<h3 className="font-montserrat text-base font-bold">
							Apply a discount code
						</h3>
						<div className="group mt-2">
							<div className="flex min-h-[216px] flex-col justify-between text-black dark:text-white">
								<div>
									<div className="mb-4">
										<div className="flex flex-row">
											<Input
												width="medium"
												type="text"
												placeholder="NEWSTORE5"
												defaultValue={discountInput}
												className="mr-3"
												onChange={(e: any) =>
													setDiscountInput(
														e.target.value
													)
												}
											/>
											<Button
												size="medium"
												className={clsx(
													"rounded-md",
													discountInput.length < 1
														? "bg-[#7F847F] text-[#333533]"
														: ""
												)}
												onClick={submitDiscountCode}
											>
												Submit
											</Button>
										</div>
										{discountError.length > 1 && (
											<p className="text-right text-sm text-red-500">
												{discountError}
											</p>
										)}
									</div>
									{appliedDiscount && (
										<div>
											<div className="flex justify-between">
												<h3 className="font-montserrat text-base font-bold">
													Discount
												</h3>
												<h3 className="font-montserrat text-base font-bold text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
													-$
													{appliedSavings.toFixed(2)}
												</h3>
											</div>
											<div>
												<ul className="pl-3">
													{discountedItems.map(
														(item) => (
															<li className="flex list-decimal justify-between text-sm">
																<p className="dark:text-[#b4b4b4]">
																	•{" "}
																	{
																		cart.filter(
																			(
																				_item
																			) =>
																				_item.id ===
																				item.id
																		)[0]
																			.name
																	}
																</p>
																<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																	-$
																	{item.savings.toFixed(
																		2
																	)}
																</p>
															</li>
														)
													)}
												</ul>
											</div>
										</div>
									)}
								</div>
								<div className="mt-3 flex w-full justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
									<Title size="small">Total:</Title>
									<Title size="small">
										${totalCost.toFixed(2)}
									</Title>
								</div>
							</div>
						</div>
					</div>
					<div className="min-h-[200px]">
						<h3 className="font-montserrat text-base font-bold">
							Account information
						</h3>
						<div className="">
							<p className="text-sm dark:text-[#DADADA]">
								This purchase is being made for
							</p>
							<div className="mt-2 flex flex-row items-center justify-start">
								<div className="mr-4 flex cursor-pointer select-none text-sm">
									<p
										className={clsx(
											!purchaseIsGift
												? "bg-dank-300 text-white"
												: "text-[#818181] dark:bg-black/30",
											"rounded-l-md border-[1px] border-transparent px-3 py-1"
										)}
										onClick={() => setPurchaseIsGift(false)}
									>
										Myself
									</p>
									<p
										className={clsx(
											purchaseIsGift
												? "bg-dank-300 text-white"
												: "text-[#818181] dark:bg-black/30",
											"rounded-r-md border-[1px] border-transparent px-3 py-1"
										)}
										onClick={() => setPurchaseIsGift(true)}
									>
										Someone else
									</p>
								</div>
								{purchaseIsGift && (
									<Input
										width="large"
										type="text"
										placeholder="270904126974590976"
										className="!py-1"
									/>
								)}
							</div>
						</div>
						<div className="mt-3">
							<p className="text-sm dark:text-[#7F847F]">
								The following email will receive the purchase
								receipt once the payment has been processed.
							</p>
							<Input
								width="w-60"
								type="text"
								placeholder="admin@dankmemer.gg"
								defaultValue={receiptEmail}
								onChange={(e: any) =>
									setReceiptEmail(e.target.value)
								}
								className="mt-2 !py-1"
							/>
							<div
								className="mt-2 flex flex-row items-center justify-start"
								onClick={() => setAcceptedTerms(!acceptedTerms)}
							>
								<div
									className={clsx(
										!acceptedTerms
											? "border-[#3C3C3C]"
											: "border-dank-300",
										"relative mr-2 h-4 w-4 rounded border-[1px] transition-colors dark:bg-black/30"
									)}
								>
									{acceptedTerms && (
										<Iconify
											icon="bx:bx-check"
											height="16"
											className="absolute top-[-1.5px] left-[-0.5px] text-dank-300"
										/>
									)}
								</div>
								<p className="text-xs">
									I agree to Dank Memer's{" "}
									<Link href="/terms">
										<a className="text-dank-300 underline">
											Terms of Serivce
										</a>
									</Link>{" "}
									and{" "}
									<Link href="/refunds">
										<a className="text-dank-300 underline">
											Refund Policy
										</a>
									</Link>
									.
								</p>
							</div>
							<Button
								size="medium-large"
								className={clsx(
									"mt-3 w-full",
									!canCheckout
										? "bg-[#7F847F] text-[#333533]"
										: ""
								)}
								disabled={!canCheckout}
								onClick={confirmPayment}
							>
								Pay with {selectedPaymentOption}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
