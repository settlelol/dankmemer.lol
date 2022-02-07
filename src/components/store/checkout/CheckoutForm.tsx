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
import router from "next/router";
import Checkbox from "src/components/ui/Checkbox";

interface Props {
	clientSecret: string;
	paymentIntentId: string;
	invoiceId: string;
	userEmail: string;
	subtotalCost: string;
	cart: CartItem[];
}

export default function CheckoutForm({
	clientSecret,
	paymentIntentId,
	invoiceId,
	userEmail,
	subtotalCost,
	cart,
}: Props) {
	const [totalCost, setTotalCost] = useState<string>("0.00");
	const [processingPayment, setProcessingPayment] = useState(false);
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

	const [saveCardAsDefault, setSaveCardAsDefault] = useState(false);

	const [appliedDiscountCode, setAppliedDiscountCode] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	const [giftReceipient, setGiftRecipient] = useState("");
	const [purchaseIsGift, setPurchaseIsGift] = useState(false);
	const [receiptEmail, setReceiptEmail] = useState(userEmail);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	const [canCheckout, setCanCheckout] = useState(false);

	useEffect(() => {
		axios("/api/store/discount/get").then(({ data }) => {
			if (!data) return setAppliedDiscount(false);

			const { code, discountedItems, totalSavings } = data;
			if (!code || !discountedItems || !totalSavings) return;

			setAppliedDiscountCode(code);
			setDiscountedItems(discountedItems);
			setAppliedSavings(totalSavings);
			setAppliedDiscount(true);
		});
	}, []);

	useEffect(() => {
		setTotalCost((parseFloat(subtotalCost) - appliedSavings).toFixed(2));
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

	const confirmPayment = async () => {
		if (!stripe || !stripeElements || !canCheckout) return;
		setProcessingPayment(true);
		const result = await stripe.confirmCardPayment(clientSecret, {
			setup_future_usage: saveCardAsDefault ? "off_session" : null,
			payment_method: {
				card: stripeElements.getElement("cardNumber")!,
			},
		});
		if (result.error) {
			alert("SOMETHING WENT WRONG OH NO!!!!!!!!!");
			console.error(result.error);
			setProcessingPayment(false);
		} else {
			alert("Payment was a success, pogchamp");
			axios({
				method: "PATCH",
				url: `/api/store/checkout/finalize?invoice=${invoiceId}`,
				data: {
					customerName: nameOnCard,
					isGift: purchaseIsGift,
					giftFor: giftReceipient,
				},
			})
				.then(() => {
					setProcessingPayment(false);
				})
				.finally(() => {
					router.push(`/store/checkout/success?id=${invoiceId}`);
				});
		}
	};

	return (
		<div className="relative h-[620px] min-w-[58.33%]">
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
								disabled={processingPayment}
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
											disabled: processingPayment,
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
												disabled: processingPayment,
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
												disabled: processingPayment,
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
							<Checkbox
								className="!mt-4"
								state={saveCardAsDefault}
								callback={() =>
									setSaveCardAsDefault(!saveCardAsDefault)
								}
							>
								Save payment method as default.
							</Checkbox>
						</div>
					</div>
				) : (
					""
				)}
				<div className="mt-9 flex items-start justify-items-start">
					<div className="mr-9 min-h-[248px] w-80">
						<h3 className="font-montserrat text-base font-bold">
							Applied discounts
						</h3>
						<div className="flex min-h-[225px] flex-col justify-between">
							<div className="text-black dark:text-white">
								<div className="mb-2">
									<div className="flex justify-between">
										<h3 className="flex items-center justify-start text-base font-semibold text-neutral-300">
											{appliedDiscount ? (
												<>
													Code:{" "}
													<code className="ml-2 text-lg text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
														{appliedDiscountCode}
													</code>
												</>
											) : (
												<>None</>
											)}
										</h3>
									</div>
									<div className="max-h-[8rem] overflow-y-scroll">
										<ul className="pl-3">
											{discountedItems.length >= 1 &&
												cart.length >= 1 &&
												discountedItems.map((item) => (
													<li className="flex list-decimal justify-between text-sm">
														<p className="dark:text-[#b4b4b4]">
															•{" "}
															{
																cart.filter(
																	(_item) =>
																		_item.id ===
																		item.id
																)[0].name
															}
														</p>
														<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
															-$
															{item.savings.toFixed(
																2
															)}
														</p>
													</li>
												))}
										</ul>
									</div>
								</div>
							</div>
							<div className="flex w-full justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
								<Title size="small">Total:</Title>
								<Title size="small">${totalCost}</Title>
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
										onChange={(e: any) =>
											setGiftRecipient(e.target.value)
										}
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
							<Checkbox
								state={acceptedTerms}
								callback={() =>
									setAcceptedTerms(!acceptedTerms)
								}
							>
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
							</Checkbox>
							<Button
								size="medium-large"
								className={clsx(
									"mt-3 w-full",
									!canCheckout
										? "bg-neutral-500 text-neutral-800"
										: ""
								)}
								disabled={!canCheckout}
								onClick={confirmPayment}
							>
								{processingPayment ? (
									<p className="flex">
										<span className="mr-3">
											<svg
												width="23"
												height="23"
												viewBox="0 0 38 38"
												xmlns="http://www.w3.org/2000/svg"
											>
												<defs>
													<linearGradient
														x1="8.042%"
														y1="0%"
														x2="65.682%"
														y2="23.865%"
														id="a"
													>
														<stop
															stopColor="#fff"
															stopOpacity="0"
															offset="0%"
														/>
														<stop
															stopColor="#fff"
															stopOpacity=".631"
															offset="63.146%"
														/>
														<stop
															stopColor="#fff"
															offset="100%"
														/>
													</linearGradient>
												</defs>
												<g
													fill="none"
													fill-rule="evenodd"
												>
													<g transform="translate(1 1)">
														<path
															d="M36 18c0-9.94-8.06-18-18-18"
															id="Oval-2"
															stroke="url(#a)"
															strokeWidth="2"
														>
															<animateTransform
																attributeName="transform"
																type="rotate"
																from="0 18 18"
																to="360 18 18"
																dur="0.9s"
																repeatCount="indefinite"
															/>
														</path>
														<circle
															fill="#fff"
															cx="36"
															cy="18"
															r="1"
														>
															<animateTransform
																attributeName="transform"
																type="rotate"
																from="0 18 18"
																to="360 18 18"
																dur="0.9s"
																repeatCount="indefinite"
															/>
														</circle>
													</g>
												</g>
											</svg>
										</span>
										Processing payment...
									</p>
								) : (
									<p>Pay with {selectedPaymentOption}</p>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
