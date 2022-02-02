import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
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
	StripeElement,
	StripeElementsOptions,
} from "@stripe/stripe-js";
import {
	useStripe,
	useElements,
	Elements,
	CardElement,
	PaymentElement,
	CardNumberElement,
	CardExpiryElement,
	CardCvcElement,
} from "@stripe/react-stripe-js";

import PaymentOption from "src/components/store/checkout/PaymentOption";
import Visa from "public/img/store/cards/Visa.svg";
import Mastercard from "public/img/store/cards/Mastercard.svg";
import Discover from "public/img/store/cards/Discover.svg";
import Amex from "public/img/store/cards/Amex.svg";
import Stripe from "stripe";

const _stripeElementsOptions: StripeElementsOptions = {
	appearance: {
		rules: {
			".Input": {},
		},
	},
};

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function Checkout({ user }: PageProps) {
	const router = useRouter();

	const [stripeElementsOptions, setStripeElementsOptions] =
		useState<StripeElementsOptions>();
	const [loaded, setLoaded] = useState(false);
	const [cart, setCart] = useState<CartItems[]>([]);
	const [totalCost, setTotalCost] = useState<string | number>(0);
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("card");

	const [nameOnCard, setNameOnCard] = useState("");

	useEffect(() => {
		axios("/api/store/checkout/setup").then(({ data }) => {
			setStripeElementsOptions({
				..._stripeElementsOptions,
				clientSecret: data.client_secret,
			});
		});

		axios("/api/store/cart/get").then(({ data }) => {
			setLoaded(true);
			setCart(data.cart);
		});
	}, []);

	return (
		<Elements stripe={stripePromise} options={stripeElementsOptions}>
			<Container title="Checkout" user={user}>
				<div className="flex flex-col sm:flex-row justify-between items-center mt-12 mb-5 space-y-2 sm:space-y-0">
					<Title size="big">Checkout</Title>
				</div>
				<div className="flex justify-between">
					<div className="flex flex-col w-7/12 h-max">
						<div className="px-4 py-3 w-full h-max bg-light-500 dark:bg-dark-200 rounded-lg">
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
											selectedPaymentOption === "card"
										}
										select={() =>
											setSelectedPaymentOption("card")
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
											selectedPaymentOption === "paypal"
										}
										select={() =>
											setSelectedPaymentOption("paypal")
										}
									/>
								</div>
							</div>
							<div className="flex justify-start items-center">
								<div>
									<div className="flex flex-col text-black dark:text-white">
										<label htmlFor="noc" className="mb-2">
											Name on card
										</label>
										<input
											name="noc"
											type="text"
											className="max-w-[200px] px-3 py-2 font-inter text-sm border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus-visible:border-dank-300 focus-visible:outline-none"
											defaultValue={nameOnCard}
											placeholder="John doe"
										/>
									</div>
									<div className="flex justify-start items-center mt-3">
										<div className="w-48 mr-5">
											<label>Card number</label>
											<CardNumberElement
												options={{
													placeholder:
														"4024 0071 1411 4951",
													style: {
														base: {
															color: "#ffffff",
															fontFamily:
																"Inter, sans-serif",
															fontWeight: "400",
															fontSize: "14px",
															lineHeight: "20px",
															"::placeholder": {
																color: "#9ca3af",
															},
														},
													},
													classes: {
														base: "mt-2 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
														focus: "border-[#199532]",
													},
												}}
											/>
										</div>
										<div className="w-max mr-5">
											<label>Expiry</label>
											<div className="w-20">
												<CardExpiryElement
													options={{
														placeholder: "04 / 25",
														style: {
															base: {
																color: "#ffffff",
																fontFamily:
																	"Inter, sans-serif",
																fontWeight:
																	"400",
																fontSize:
																	"14px",
																lineHeight:
																	"20px",
																"::placeholder":
																	{
																		color: "#9ca3af",
																	},
															},
														},
														classes: {
															base: "mt-2 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
															focus: "border-[#199532]",
														},
													}}
												/>
											</div>
										</div>
										<div className="w-48">
											<label>CVC</label>
											<div className="w-14">
												<CardCvcElement
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
																lineHeight:
																	"20px",
																"::placeholder":
																	{
																		color: "#9ca3af",
																	},
															},
														},
														classes: {
															base: "mt-2 px-3 py-2 border-[1px] border-[#3C3C3C] dark:bg-black/30 rounded-md focus:border-dank-300",
															focus: "border-[#199532]",
														},
													}}
												/>
											</div>
										</div>
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
