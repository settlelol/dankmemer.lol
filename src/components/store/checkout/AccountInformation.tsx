import clsx from "clsx";
import { useTheme } from "next-themes";
import Checkbox from "src/components/ui/Checkbox";
import Input from "../Input";
import Button from "src/components/ui/Button";
import Link from "next/link";
import { PaymentRequest, Stripe } from "@stripe/stripe-js";
import { PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { PayPalButton } from "react-paypal-button-v2";

interface Props {
	stripe: Stripe | null;
	clientSecret: string;
	canCheckout: Boolean;
	acceptsIntegratedWallet: Boolean;
	integratedWallet: PaymentRequest | null;
	selectedPaymentOption:
		| "Card"
		| "PayPal"
		| "ApplePay"
		| "GooglePay"
		| "MicrosoftPay";

	userEmail: string;
	processingPayment: Boolean;
	confirmPayment: any;
	completedPayment: any;
	totalCost: string;
	integratedWalletButtonType: "check-out" | "subscribe";
}

export default function AccountInformation({
	stripe,
	clientSecret,
	canCheckout,
	acceptsIntegratedWallet,
	integratedWallet,
	selectedPaymentOption,
	processingPayment,
	confirmPayment,
	completedPayment,
	userEmail,
	totalCost,
	integratedWalletButtonType,
}: Props) {
	const { theme } = useTheme();

	const [giftRecipient, setGiftRecipient] = useState("");
	const [isGift, setIsGift] = useState(false);

	const [receiptEmail, setReceiptEmail] = useState(userEmail);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

	// Remade to fit new store!
	const createPayment = () => {
		const totalWithTax = (
			parseFloat(totalCost) +
			parseFloat(totalCost) * 0.0675
		).toFixed(2);
		return {
			intent: "CAPTURE", // Capture a payment, no pre-authorization,
			purchase_units: [
				{
					amount: {
						value: totalWithTax,
						currency_code: "USD",
						breakdown: {
							currency_code: "USD",
							value: totalWithTax,
						},
						shipping_discount: {
							currency_code: "USD",
							value: "0.00",
						},
					},
					description: "Dankmemer Store",
					custom_id: clientSecret,
					items: [
						{
							name: "Deez nuts",
							unit_amount: {
								currency_code: "USD",
								value: "4.99",
							},
							quantity: "1",
							category: "DIGITAL_GOODS",
						},
						{
							name: "Sales tax",
							unit_amount: {
								currency_code: "USD",
								value: (parseFloat(totalCost) * 0.0675).toFixed(
									2
								),
							},
							quantity: "1",
							category: "DIGITAL_GOODS",
						},
					],
				},
			],
			application_context: {
				brand_name: "Dankmemer's Webstore",
				shipping_preference: "NO_SHIPPING",
				user_action: "PAY_NOW",
			},
		};
	};

	useEffect(() => {
		if (!integratedWallet || !stripe || !clientSecret) return;
		integratedWallet.once("paymentmethod", async (e) => {
			const { paymentIntent, error: confirmPaymentError } =
				await stripe.confirmCardPayment(
					clientSecret,
					{ payment_method: e.paymentMethod.id },
					{ handleActions: false }
				);

			if (confirmPaymentError) {
				e.complete("fail");
			} else {
				e.complete("success");
				if (paymentIntent?.status === "requires_action") {
					const { error: actionError } =
						await stripe.confirmCardPayment(clientSecret);
					if (actionError) {
						alert("22222 SOMETHING WENT WRONG OH NO!!!!!!!!!");
					} else {
						completedPayment();
					}
				} else {
					completedPayment();
				}
			}
		});
	}, [integratedWallet, stripe, clientSecret]);

	return (
		<div className="min-h-[200px]">
			<h3 className="font-montserrat text-base font-bold">
				Account information
			</h3>
			<div className="">
				<p className="text-sm dark:text-neutral-300">
					This purchase is being made for
				</p>
				<div className="mt-2 flex flex-col justify-start phone:flex-row phone:items-center">
					<div className="mr-4 flex cursor-pointer select-none text-sm">
						<p
							className={clsx(
								!isGift
									? "bg-dank-300 text-white"
									: "text-neutral-400 dark:bg-black/30",
								"rounded-l-md border-[1px] border-transparent px-3 py-1"
							)}
							onClick={() => setIsGift(false)}
						>
							Myself
						</p>
						<p
							className={clsx(
								isGift
									? "bg-dank-300 text-white"
									: "text-neutral-400 dark:bg-black/30",
								"rounded-r-md border-[1px] border-transparent px-3 py-1"
							)}
							onClick={() => setIsGift(true)}
						>
							Someone else
						</p>
					</div>
					{isGift && (
						<div className="mt-2 phone:mt-0">
							<Input
								width="large"
								type="text"
								placeholder="270904126974590976"
								className="!py-1 "
								onChange={(e: any) =>
									setGiftRecipient(e.target.value)
								}
							/>
						</div>
					)}
				</div>
			</div>
			<div className="mt-3">
				<p className="text-sm dark:text-[#7F847F]">
					The following email will receive the purchase receipt once
					the payment has been processed.
				</p>
				<Input
					width="w-60"
					type="email"
					placeholder="support@dankmemer.gg"
					defaultValue={receiptEmail}
					onChange={(e: any) => setReceiptEmail(e.target.value)}
					className="mt-2 !py-1"
				/>
				<Checkbox
					state={acceptedTerms}
					callback={() => setAcceptedTerms(!acceptedTerms)}
				>
					I agree to Dank Memer's{" "}
					<Link href="/terms">
						<a className="text-dank-300 underline">
							Terms of Serivce
						</a>
					</Link>{" "}
					and{" "}
					<Link href="/refunds">
						<a className="text-dank-300 underline">Refund Policy</a>
					</Link>
					.
				</Checkbox>
				{acceptsIntegratedWallet &&
				integratedWallet !== null &&
				selectedPaymentOption !== "Card" &&
				selectedPaymentOption !== "PayPal" ? (
					receiptEmail.length >= 5 && acceptedTerms ? (
						<div className="mt-3">
							<PaymentRequestButtonElement
								options={{
									paymentRequest: integratedWallet,
									style: {
										paymentRequestButton: {
											type: integratedWalletButtonType,
											theme:
												theme === "dark"
													? "dark"
													: "light",
										},
									},
								}}
							/>
						</div>
					) : (
						<div className="mt-3 h-10 w-full rounded-md bg-white/10"></div>
					)
				) : selectedPaymentOption === "PayPal" ? (
					<PayPalButton
						options={{
							clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
						}}
						style={{
							height: 50,
							fontFamily: "'Inter', sans-serif",
							layout: "horizontal",
						}}
						createOrder={(_: any, actions: any) =>
							actions.order.create(createPayment())
						}
						onApprove={(_: any, actions: any) => alert("approved")}
					/>
				) : (
					<Button
						size="medium-large"
						className={clsx(
							"mt-3 w-full",
							!(
								canCheckout &&
								receiptEmail.length >= 5 &&
								acceptedTerms
							)
								? "bg-neutral-500 text-neutral-800"
								: ""
						)}
						disabled={
							!(
								canCheckout &&
								receiptEmail.length >= 5 &&
								acceptedTerms
							)
						}
						onClick={() =>
							confirmPayment(isGift, giftRecipient, receiptEmail)
						}
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
										<g fill="none" fill-rule="evenodd">
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
							<p>
								Pay ${totalCost} with {selectedPaymentOption}
							</p>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
