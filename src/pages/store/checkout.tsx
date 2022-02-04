import axios from "axios";
import { GetServerSideProps } from "next";
import Link from "next/link";

import { useEffect, useState } from "react";
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

interface DiscountItem {
	id: string;
	originalCost: number;
	discountedCost: number;
}

export default function Checkout({ user }: PageProps) {
	const router = useRouter();

	const [stripeElementsOptions, setStripeElementsOptions] =
		useState<StripeElementsOptions>();
	const [loaded, setLoaded] = useState(false);
	const [cart, setCart] = useState<CartItems[]>([]);
	const [totalCost, setTotalCost] = useState<string | number>(0);
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
	const [discountedCost, setDiscountedCost] = useState(0);
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
			})
			.catch((e) => {
				console.error(e);
			});

		axios("/api/store/cart/get").then(({ data }) => {
			setLoaded(true);
			setCart(data.cart);
		});
	}, []);

	useEffect(() => {
		if (discountedItems.length < 1) return setDiscountedCost(0);
		else
			setDiscountedCost(
				parseFloat(
					discountedItems
						.map((item) => item.originalCost - item.discountedCost)
						.reduce((a: number, b: number) => a + b)
						.toFixed(2)
				)
			);
	}, [discountedItems]);

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
	};

	return (
		<Elements stripe={stripePromise} options={stripeElementsOptions}>
			<Container title="Checkout" user={user}>
				<div className="flex flex-col sm:flex-row justify-between items-center mt-12 mb-5 space-y-2 sm:space-y-0">
					<Title size="big">Checkout</Title>
				</div>
				<div className="flex justify-between">
					<div className="flex flex-col w-3/5 h-max">
						<div className="px-8 py-7 w-full h-max bg-light-500 dark:bg-dark-200 rounded-lg">
							<div className="mb-4">
								<Title size="small">Payment Method</Title>
								<div className="flex justify-start mt-3">
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
											selectedPaymentOption === "PayPal"
										}
										select={() =>
											setSelectedPaymentOption("PayPal")
										}
									/>
								</div>
							</div>
							{selectedPaymentOption === "Card" ? (
								<div className="flex justify-start items-center mt-9 overflow-hidden">
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
												setNameOnCard(e.target.value)
											}
											placeholder="John doe"
										/>
										<div className="flex justify-start items-center mt-2">
											<div className="w-48 mr-7">
												<label>Card number</label>
												<CardNumberElement
													onChange={(data) =>
														setCardNumberInput(data)
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
											<div className="w-max mr-5">
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
															placeholder: "964",
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
							<div className="flex justify-items-start items-start mt-9">
								<div className="min-h-[200px] mr-9">
									<h3 className="text-base font-bold font-montserrat">
										Apply a discount code
									</h3>
									<div className="group mt-2">
										<div className="flex flex-col text-black dark:text-white">
											<div className="flex flex-row mb-4">
												<Input
													width="medium"
													type="text"
													placeholder="NEWSTORE5"
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
												>
													Submit
												</Button>
											</div>
											{appliedDiscount && (
												<div>
													<div className="flex justify-between">
														<h3 className="text-base font-bold font-montserrat">
															Discount
														</h3>
														<h3 className="text-base font-bold font-montserrat text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
															-$
															{}
														</h3>
														<div className="flex justify-between mt-3 px-4 py-3 dark:bg-dank-500 w-full rounded-lg">
															<Title size="small">
																Total:
															</Title>
															<Title size="small">
																${totalCost}
															</Title>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
								<div className="min-h-[200px]">
									<h3 className="text-base font-bold font-montserrat">
										Account information
									</h3>
									<div className="">
										<p className="text-sm dark:text-[#DADADA]">
											This purchase is being made for
										</p>
										<div className="flex flex-row justify-start items-center mt-2">
											<div className="flex text-sm cursor-pointer select-none mr-4">
												<p
													className={clsx(
														!purchaseIsGift
															? "bg-dank-300 text-white"
															: "dark:bg-black/30 text-[#818181]",
														"px-3 py-1 rounded-l-md border-[1px] border-transparent"
													)}
													onClick={() =>
														setPurchaseIsGift(false)
													}
												>
													Myself
												</p>
												<p
													className={clsx(
														purchaseIsGift
															? "bg-dank-300 text-white"
															: "dark:bg-black/30 text-[#818181]",
														"px-3 py-1 rounded-r-md border-[1px] border-transparent"
													)}
													onClick={() =>
														setPurchaseIsGift(true)
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
											The following email will receive the
											purchase receipt once the payment
											has been processed.
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
											className="flex flex-row justify-start items-center mt-2"
											onClick={() =>
												setAcceptedTerms(!acceptedTerms)
											}
										>
											<div
												className={clsx(
													!acceptedTerms
														? "border-[#3C3C3C]"
														: "border-dank-300",
													"relative w-4 h-4 border-[1px] dark:bg-black/30 mr-2 rounded transition-colors"
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
				</div>
			</Container>
		</Elements>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
