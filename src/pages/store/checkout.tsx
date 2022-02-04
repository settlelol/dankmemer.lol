import axios from "axios";
import { GetServerSideProps } from "next";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { CartItem as CartItems } from ".";
import { useRouter } from "next/router";
import {
	loadStripe,
	StripeCardCvcElementChangeEvent,
	StripeCardExpiryElementChangeEvent,
	StripeCardNumberElementChangeEvent,
	StripeElementsOptions,
} from "@stripe/stripe-js";
import {
	Elements,
	CardNumberElement,
	CardExpiryElement,
	CardCvcElement,
} from "@stripe/react-stripe-js";

import PaymentOption from "src/components/store/checkout/PaymentOption";
import Visa from "public/img/store/cards/Visa.svg";
import Mastercard from "public/img/store/cards/Mastercard.svg";
import Discover from "public/img/store/cards/Discover.svg";
import Amex from "public/img/store/cards/Amex.svg";
import Card from "public/img/store/card/Card.svg";

import Button from "src/components/ui/Button";
import Input from "src/components/store/Input";
import clsx from "clsx";
import { Icon as Iconify } from "@iconify/react";

const _stripeElementsOptions: StripeElementsOptions = {};

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export interface DiscountItem {
	id: string;
	type: "one_time" | "recurring";
	originalCost: number;
	discountedCost: number;
	savings: number;
}

export default function Checkout({ user }: PageProps) {
	const router = useRouter();
	const paymentIntentId = useRef<string>("");

	const [stripeElementsOptions, setStripeElementsOptions] =
		useState<StripeElementsOptions>();
	const [loaded, setLoaded] = useState(false);
	const [cart, setCart] = useState<CartItems[]>([]);

	const [subtotalCost, setSubtotalCost] = useState<number>(0);
	const [totalCost, setTotalCost] = useState<number>(0);

	const [selectedPaymentOption, setSelectedPaymentOption] = useState("Card");

	const [nameOnCard, setNameOnCard] = useState("");
	const [cardBrand, setCardBrand] = useState("");

	// Stripe input states
	const [cardNumberInput, setCardNumberInput] =
		useState<StripeCardNumberElementChangeEvent>();
	const [cardExpiryInput, setCardExpiryInput] =
		useState<StripeCardExpiryElementChangeEvent>();
	const [cardCvcInput, setCardCvcInput] =
		useState<StripeCardCvcElementChangeEvent>();

	const [discountInput, setDiscountInput] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	const [purchaseIsGift, setPurchaseIsGift] = useState(false);
	const [receiptEmail, setReceiptEmail] = useState(user!.email);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	const [canCheckout, setCanCheckout] = useState(false);

	useEffect(() => {
		axios("/api/store/checkout/setup")
			.then(({ data }) => {
				setStripeElementsOptions({
					..._stripeElementsOptions,
					clientSecret: data.client_secret,
				});
				paymentIntentId.current = data.payment_intent;
			})
			.catch((e) => {
				console.error(e);
			});

		axios("/api/store/cart/get").then(({ data }) => {
			setLoaded(true);
			setCart(data.cart);
			setSubtotalCost(
				data.cart
					.map(
						(item: CartItems) =>
							(item.price.type === "recurring"
								? item.price.interval === "year"
									? item.unit_cost * 10.8 // 10.8 is just 12 months (x12) with a 10% discount
									: item.unit_cost
								: item.unit_cost) * item.quantity
					)
					.reduce((a: number, b: number) => a + b)
					.toFixed(2)
			);
		});
	}, []);

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
			});
	};

	return (
		<Elements stripe={stripePromise} options={stripeElementsOptions}>
			<Container title="Checkout" user={user}>
				<div className="mb-16">
					<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="big">Checkout</Title>
					</div>
					<div className="flex justify-between">
						<div className="h-max w-7/12">
							<div className="h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
								<div className="mb-4">
									<Title size="small">Payment Method</Title>
									<div className="mt-3 flex justify-start">
										<PaymentOption
											icons={[
												<Visa
													key="visa"
													className="mr-1"
												/>,
												<Mastercard
													key="mastercard"
													className="mr-1"
												/>,
												<Amex
													key="amex"
													className="mr-1"
												/>,
												<Discover key="discover" />,
											]}
											selected={
												selectedPaymentOption === "Card"
											}
											select={() =>
												setSelectedPaymentOption("Card")
											}
										/>
										<PaymentOption
											icons={[
												<img
													key="paypal"
													src="/img/store/PayPal.png"
													width={70}
												/>,
											]}
											selected={
												selectedPaymentOption ===
												"PayPal"
											}
											select={() =>
												setSelectedPaymentOption(
													"PayPal"
												)
											}
										/>
									</div>
								</div>
								{selectedPaymentOption === "Card" ? (
									<div className="mt-9 flex items-center justify-start overflow-hidden">
										{/* <div className="mr-5">
									<Card brand={cardNumberInput.brand} />
								</div> */}
										<div>
											<Input
												width="large"
												type="text"
												label="Name on card"
												defaultValue={nameOnCard}
												onChange={(e: any) =>
													setNameOnCard(
														e.target.value
													)
												}
												placeholder="John doe"
											/>
											<div className="mt-2 flex items-center justify-start">
												<div className="mr-7 w-48">
													<label>Card number</label>
													<CardNumberElement
														onChange={(data) =>
															setCardNumberInput(
																data
															)
														}
														options={{
															placeholder:
																"4024 0071 1411 4951",
															style: {
																base: {
																	color: "#ffffff",
																	fontFamily:
																		"Inter, sans-serif",
																	fontWeight:
																		"400",
																	fontSize:
																		"14px",
																	"::placeholder":
																		{
																			color: "#9ca3af",
																		},
																},
															},
															classes: {
																base: "mt-1 w-[200px] px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
																focus: "border-[#199532] outline-none",
															},
														}}
													/>
												</div>
												<div className="mr-5 w-max">
													<label>Expiry</label>
													<div className="w-20">
														<CardExpiryElement
															onChange={(data) =>
																setCardExpiryInput(
																	data
																)
															}
															options={{
																placeholder:
																	"04 / 25",
																style: {
																	base: {
																		color: "#ffffff",
																		fontFamily:
																			"Inter, sans-serif",
																		fontWeight:
																			"400",
																		fontSize:
																			"14px",
																		"::placeholder":
																			{
																				color: "#9ca3af",
																			},
																	},
																},
																classes: {
																	base: "mt-1 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
																	focus: "border-[#199532]",
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
																setCardCvcInput(
																	data
																)
															}
															options={{
																placeholder:
																	"964",
																style: {
																	base: {
																		color: "#ffffff",
																		fontFamily:
																			"Inter, sans-serif",
																		fontWeight:
																			"400",
																		fontSize:
																			"14px",
																		"::placeholder":
																			{
																				color: "#9ca3af",
																			},
																	},
																},
																classes: {
																	base: "mt-1 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
																	focus: "border-[#199532]",
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
													<div className="mb-4 flex flex-row">
														<Input
															width="medium"
															type="text"
															placeholder="NEWSTORE5"
															defaultValue={
																discountInput
															}
															className="mr-3"
															onChange={(
																e: any
															) =>
																setDiscountInput(
																	e.target
																		.value
																)
															}
														/>
														<Button
															size="medium"
															className={clsx(
																"rounded-md",
																discountInput.length <
																	1
																	? "bg-[#7F847F] text-[#333533]"
																	: ""
															)}
															onClick={
																submitDiscountCode
															}
														>
															Submit
														</Button>
													</div>
													{appliedDiscount && (
														<div>
															<div className="flex justify-between">
																<h3 className="font-montserrat text-base font-bold">
																	Discount
																</h3>
																<h3 className="font-montserrat text-base font-bold text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																	-$
																	{appliedSavings.toFixed(
																		2
																	)}
																</h3>
															</div>
															<div>
																<ul className="pl-3">
																	{discountedItems.map(
																		(
																			item
																		) => (
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
													<Title size="small">
														Total:
													</Title>
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
														onClick={() =>
															setPurchaseIsGift(
																false
															)
														}
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
														onClick={() =>
															setPurchaseIsGift(
																true
															)
														}
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
												The following email will receive
												the purchase receipt once the
												payment has been processed.
											</p>
											<Input
												width="w-60"
												type="text"
												placeholder="admin@dankmemer.gg"
												defaultValue={receiptEmail}
												onChange={(e: any) =>
													setReceiptEmail(
														e.target.value
													)
												}
												className="mt-2 !py-1"
											/>
											<div
												className="mt-2 flex flex-row items-center justify-start"
												onClick={() =>
													setAcceptedTerms(
														!acceptedTerms
													)
												}
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
											>
												Pay with {selectedPaymentOption}
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className=""></div>
					</div>
				</div>
			</Container>
		</Elements>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
