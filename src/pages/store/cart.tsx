import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useEffect, useMemo, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { withSession } from "src/util/session";
import { CartItem as CartItems } from ".";
import CartItem from "src/components/store/cart/CartItem";
import MarketingBox from "src/components/store/cart/MarketingBox";
import Button from "src/components/ui/Button";
import OtherProduct from "src/components/store/cart/OtherProduct";
import { useRouter } from "next/router";
import Input from "src/components/store/Input";
import { DiscountItem } from "./checkout";
import clsx from "clsx";
import StoreBreadcrumb from "src/components/store/StoreBreadcrumb";
import { Session } from "next-iron-session";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { toast } from "react-toastify";
import { AppliedDiscount } from "../api/store/discount/apply";

interface Props extends PageProps {
	cartData: CartItems[];
}

export default function Cart({ cartData, user }: Props) {
	const router = useRouter();

	const [processingChange, setProcessingChange] = useState<boolean>(false);
	const [cart, setCart] = useState<CartItems[]>(cartData);
	const [salesTax, setSalesTax] = useState<number>(0);
	const [subtotalCost, setSubtotalCost] = useState<number>(0);
	const [totalCost, setTotalCost] = useState<number>(0);

	const [discountData, setDiscountData] = useState<AppliedDiscount | null>(null);

	const [thresholdDiscount, setThresholdDiscount] = useState<Boolean>();
	const [discountError, setDiscountError] = useState("");
	const [discountInput, setDiscountInput] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedCode, setAppliedCode] = useState("");
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	useEffect(() => {
		const cartTotal = cart.reduce((acc: number, item: CartItems) => acc + (item.selectedPrice.price / 100) * item.quantity, 0);

		setSubtotalCost(cartTotal);
	}, []);

	useEffect(() => {
		try {
			axios({
				url: "/api/store/cart/set",
				method: "PUT",
				data: { cartData: cart },
			}).then(() => {
				const cartTotal = cart.reduce((acc: number, item: CartItems) => acc + (item.selectedPrice.price / 100) * item.quantity, 0);
				setSubtotalCost(cartTotal);

				if (discountInput.length >= 1) {
					recalculateDiscount();
				} else {
					setAppliedDiscount(appliedDiscount ?? cartTotal >= 20);
					axios("/api/store/discount/get")
						.then(({ data }) => {
							setAppliedDiscount(true);
							setDiscountData(data);
						})
						.catch(() => {
							const _salesTax = cartTotal * 0.0675;

							setThresholdDiscount(cartTotal >= 20);
							setSalesTax(_salesTax);
							setTotalCost(cartTotal + _salesTax);
						});
				}
			});
		} catch (e: any) {
			if (e.response.status === 429) {
				toast.error("You are doing that too fast! Input a number instead of incrementing it.", {
					theme: "colored",
					position: "top-center",
				});
			}
		}
		if (cart.length < 1) {
			router.push("/store");
		}
	}, [cart]);

	useEffect(() => {
		if (discountError.length > 1) return setDiscountError("");
	}, [discountInput]);

	const deleteItem = (index: number) => {
		if (!processingChange) {
			const _cart = [...cart];
			_cart.splice(index, 1);
			setCart(_cart);
		}
	};

	const updateQuantity = (index: number, quantity: number) => {
		if (!processingChange) {
			const _cart = [...cart];
			_cart[index].quantity = quantity;
			setCart(_cart);
		}
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		if (!processingChange) {
			const _cart: CartItems[] = [...cart];
			_cart[index].selectedPrice = _cart[index].prices.filter((price) => price.interval === interval)[0];
			setCart(_cart);
		}
	};

	const removeDiscount = () => {
		axios(`/api/store/discount/remove`)
			.then(() => {
				setAppliedCode("");
				setAppliedSavings(0);
				setDiscountInput("");
				setDiscountedItems([]);
				setAppliedDiscount(false);
			})
			.catch(() => {
				setDiscountError("No discount is currently active");
				setTimeout(() => {
					setDiscountError("");
				}, 3_000);
			});
	};

	const submitDiscountCode = () => {
		if (discountInput.length < 1) return;
		if (discountError.length > 1) return setDiscountError("");

		setProcessingChange(true);
		axios(`/api/store/discount/apply?code=${discountInput}`)
			.then(({ data }) => {
				setAppliedDiscount(true);
				setDiscountData(data);
			})
			.catch((e) => {
				setAppliedCode("");
				switch (e.response.status) {
					case 403:
						setDiscountError("Minimum cart value not met.");
						break;
					case 404:
						setDiscountError("Invalid discount code provided.");
						break;
					case 406:
						setDiscountError("Could not apply to any cart items.");
						break;
					case 410:
						setDiscountError("Discount code has expired.");
						break;
					default:
						console.log(`Unhandled discount error code: ${e.response.status}`);
				}
			})
			.finally(() => setProcessingChange(false));
	};

	const recalculateDiscount = () => {
		if (appliedCode.length < 1) {
			return;
		}

		setProcessingChange(true);
		axios({
			method: "POST",
			url: `/api/store/discount/recalculate`,
			data: { code: appliedCode, cart },
		})
			.then(({ data }) => {
				setAppliedDiscount(true);
				setDiscountData(data);
			})
			.catch((e) => {
				setAppliedCode("");
				console.error(e);
			})
			.finally(() => setProcessingChange(false));
	};

	useMemo(() => {
		const data = discountData;
		if (!data) {
			return;
		}
		const _salesTax = subtotalCost * 0.0675;
		const total = subtotalCost + _salesTax - data.totalSavings;

		setAppliedCode(data.code);
		setDiscountInput(data.code);
		setDiscountedItems(data.discountedItems);
		setAppliedSavings(data.totalSavings ?? 0);
		setSalesTax(_salesTax);
		setTotalCost(total);
		setThresholdDiscount(total >= 20);
	}, [discountData, subtotalCost]);

	const addToCart = async (item: CartItems) => {
		let toastMessage: string | undefined;
		const typeToAdd = item.metadata!.type;
		const cartHasSubscription = cart.filter((i) => i.metadata?.type === "subscription").length >= 1;
		const cartHasSingle = cart.filter((i) => i.metadata?.type === "single").length >= 1;

		if (typeToAdd === "subscription" && cartHasSubscription) {
			toastMessage = "Only one subscription should be added your cart at a time.";
		} else if (typeToAdd === "subscription" && cartHasSingle) {
			toastMessage = "You cannot combine subscription and single-purchase products.";
		} else if (typeToAdd == "single" && cartHasSubscription) {
			toastMessage = "You cannot combine subscription and single-purchase products.";
		}

		if (toastMessage) {
			return toast.info(toastMessage, {
				position: "top-center",
				theme: "colored",
				hideProgressBar: true,
				autoClose: 3000,
			});
		}

		const alreadyExists = cart.findIndex((i) => i.id === item.id);
		if (alreadyExists !== -1) {
			let _cart = cart.slice();
			_cart[alreadyExists].quantity += 1;
			setCart(_cart);
		} else {
			setCart((i) => [...i, item]);
		}
	};

	return (
		<Container title="Shopping Cart" user={user}>
			<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
				<Title size="big">Shopping cart</Title>
			</div>
			<StoreBreadcrumb currentPage="cart" />

			<div className="flex justify-between">
				<div className="flex w-[73%] flex-col">
					<div className="h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
						<Title size="small">Your items</Title>
						<div className="mt-2">
							{cart.map((item, i) => (
								<CartItem size="large" index={i} {...item} updateQuantity={updateQuantity} changeInterval={changeInterval} deleteItem={deleteItem} disabled={processingChange} />
							))}
						</div>
					</div>
					<div className="mt-5 h-max w-full rounded-lg bg-light-500 px-4 py-3 dark:bg-dark-200">
						<Title size="small">Other users have also bought</Title>
						<div className="mt-2">
							{/* 
								TODO: (Badosz) Create some kind of mongo query to get either:
								a) Random products out of recent purchases
								b) Random products that users have bought
								c) Most purchased products
								d) [Not sure how reasonable] Past purchases that includes some or all of the current cart's items

								Pick whichever you want I have no preference but you shouldn't need the
								cart check because it will be in a different array

								-InBlue xqcL

								TODO: (Blue) Create a way to present a sale on an item here.
							*/}
							{cart.length >= 1 && <OtherProduct {...cart[0]} addToCart={addToCart} />}
						</div>
					</div>
				</div>
				<div className="flex w-80 flex-col">
					<MarketingBox
						color="blue"
						title="Extra Savings"
						topText="Unlock more savings by purchasing an annual subscription!"
						bottomText="When purchasing a subscription you are able to save up to 10% by switching to annual subscription rather than a monthly subscription."
					/>
					<div className="my-5 h-max w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
						<Title size="small">Details</Title>
						<p className="mt-2 font-inter text-sm leading-tight text-neutral-700/80 dark:text-light-600">
							Checkout is completed in USD, bank or card fees may apply to international payments. The total below is what is required to be paid upon checkout.
						</p>
						<div className="mt-3 mr-9 w-full">
							<h3 className="font-montserrat text-base font-bold text-black dark:text-white">Apply a discount code</h3>
							<div className="group mt-2">
								<div className="flex flex-col justify-between text-black dark:text-white">
									<div>
										<div className="mb-4">
											<div className="flex flex-row">
												<Input
													width="medium"
													type="text"
													placeholder="NEWSTORE5"
													value={discountInput}
													className="mr-3"
													onChange={(e: any) => setDiscountInput(e.target.value)}
												/>
												<Button
													size="medium"
													className={clsx(
														"w-full rounded-md",
														discountInput?.length < 1 || processingChange ? "!bg-[#7F847F] text-[#333533]" : "",
														appliedDiscount && appliedCode === discountInput && "bg-red-500"
													)}
													onClick={appliedDiscount ? removeDiscount : submitDiscountCode}
													disabled={processingChange}
												>
													{appliedDiscount && appliedCode === discountInput ? "Clear" : "Submit"}
												</Button>
											</div>
											{discountError.length > 1 && <p className="text-right text-sm text-red-500">{discountError}</p>}
										</div>
										{(appliedDiscount || thresholdDiscount) && (
											<div>
												<div className="flex items-center justify-between">
													<h3 className="font-montserrat text-base font-bold">Discount</h3>
													{processingChange ? (
														<div className="h-5 w-12 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
													) : (
														<h3 className="font-montserrat text-base font-bold text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
															-$
															{(appliedSavings + (thresholdDiscount ? totalCost * 0.1 : 0)).toFixed(2)}
														</h3>
													)}
												</div>
												<div>
													<ul className="pl-3">
														{discountedItems?.map((item) => {
															const cartItem = cart.filter((_item) => _item.id === item.id)[0];
															return (
																<li className="flex list-decimal justify-between text-sm">
																	<p className="dark:text-[#b4b4b4]">
																		• {cartItem.quantity}x {cartItem.name}
																	</p>
																	<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																		-$
																		{item.savings.toFixed(2)}
																	</p>
																</li>
															);
														})}
														{thresholdDiscount && (
															<li className="flex list-decimal items-center justify-between text-sm">
																<p className="flex items-center justify-center space-x-1 dark:text-[#b4b4b4]">
																	<span>• Threshold discount</span>
																	<Tooltip content="10% Discount applied because base cart value exceeds $20">
																		<Iconify icon="ant-design:question-circle-filled" />
																	</Tooltip>
																</p>
																{processingChange ? (
																	<div className="h-4 w-12 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
																) : (
																	<p className="text-[#0FA958] drop-shadow-[0px_0px_4px_#0FA95898]">
																		-$
																		{(totalCost * 0.1).toFixed(2)}
																	</p>
																)}
															</li>
														)}
													</ul>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
						<div className="mt-3">
							<p className="text-right text-sm text-neutral-600 dark:text-neutral-300/50">Added sales tax: ${salesTax.toFixed(2)}</p>
							<div className="flex w-full items-center justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
								<Title size="small">Total:</Title>
								{processingChange ? (
									<div className="h-5 w-16 animate-[pulse_0.5s_ease-in-out_infinite] rounded bg-dank-400"></div>
								) : (
									<Title size="small">${(totalCost - (thresholdDiscount ? totalCost * 0.1 : 0)).toFixed(2)}</Title>
								)}
							</div>
						</div>

						<Button
							size="medium"
							className={clsx("mt-3 w-full", processingChange ? "bg-[#7F847F] text-[#333533]" : "")}
							onClick={() => router.push("/store/checkout")}
							disabled={processingChange}
						>
							Continue to Checkout
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
	const user = await ctx.req.session.get("user");

	if (!user) {
		return {
			redirect: {
				destination: `/api/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
				permanent: false,
			},
		};
	}

	const cart = await ctx.req.session.get("cart");
	if (!cart)
		return {
			redirect: {
				destination: `/store`,
				permanent: false,
			},
		};

	return {
		props: { cartData: cart, user },
	};
});
