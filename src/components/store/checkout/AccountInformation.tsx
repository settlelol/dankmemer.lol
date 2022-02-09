import clsx from "clsx";
import { useTheme } from "next-themes";
import Checkbox from "src/components/ui/Checkbox";
import Input from "../Input";
import Button from "src/components/ui/Button";
import Link from "next/link";
import { PaymentRequest } from "@stripe/stripe-js";
import { PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { useState } from "react";

interface Props {
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
	totalCost: string;
	integratedWalletButtonType: "check-out" | "subscribe";
}

export default function AccountInformation({
	canCheckout,
	acceptsIntegratedWallet,
	integratedWallet,
	selectedPaymentOption,
	processingPayment,
	confirmPayment,
	userEmail,
	totalCost,
	integratedWalletButtonType,
}: Props) {
	const { theme } = useTheme();

	const [giftRecipient, setGiftRecipient] = useState("");
	const [isGift, setIsGift] = useState(false);

	const [receiptEmail, setReceiptEmail] = useState(userEmail);
	const [acceptedTerms, setAcceptedTerms] = useState(false);

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
					type="text"
					placeholder="admin@dankmemer.gg"
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
				{acceptsIntegratedWallet && integratedWallet !== null ? (
					<div className="mt-3">
						<PaymentRequestButtonElement
							options={{
								paymentRequest: integratedWallet,
								style: {
									paymentRequestButton: {
										type: integratedWalletButtonType,
										theme:
											theme === "dark" ? "dark" : "light",
									},
								},
							}}
						/>
					</div>
				) : (
					<Button
						size="medium-large"
						className={clsx(
							"mt-3 w-full",
							!canCheckout
								? "bg-neutral-500 text-neutral-800"
								: ""
						)}
						disabled={
							!canCheckout &&
							receiptEmail.length >= 5 &&
							acceptedTerms
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
