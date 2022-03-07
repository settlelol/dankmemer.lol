import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import GoBack from "src/components/ui/GoBack";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
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

interface Props extends PageProps {
	cartData: CartItems[];
}

export default function Cart({ cartData, user }: Props) {
	const router = useRouter();

	const [cart, setCart] = useState<CartItems[]>(cartData);
	const [totalCost, setTotalCost] = useState<number>(0);

	const [thresholdDiscount, setThresholdDiscount] = useState<Boolean>();
	const [discountError, setDiscountError] = useState("");
	const [discountInput, setDiscountInput] = useState("");
	const [discountedItems, setDiscountedItems] = useState<DiscountItem[]>([]);
	const [appliedSavings, setAppliedSavings] = useState(0);
	const [appliedDiscount, setAppliedDiscount] = useState(false);

	useEffect(() => {
		axios({
			url: "/api/store/cart/set",
			method: "PUT",
			data: { cartData: cart },
		});
		if (cart.length < 1) {
			router.push("/store");
		} else {
			setTotalCost(
				cart.reduce(
					(acc: number, item: CartItems) =>
						acc + (item.selectedPrice.price / 100) * item.quantity,
					0
				)
			);
			setTotalCost(cartTotal);
			setThresholdDiscount(cartTotal >= 20);
			setAppliedDiscount(false);
			setDiscountedItems([]);
			setAppliedSavings(cartTotal >= 20 ? cartTotal * 0.1 : 0);
		}
	}, [cart]);

	useEffect(() => {
		if (discountError.length > 1) return setDiscountError("");
	}, [discountInput]);

	const deleteItem = (index: number) => {
		const _cart = [...cart];
		_cart.splice(index, 1);
		setCart(_cart);
	};

	const updateQuantity = (index: number, quantity: number) => {
		const _cart = [...cart];
		_cart[index].quantity = quantity;
		setCart(_cart);
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		const _cart: CartItems[] = [...cart];
		_cart[index].selectedPrice = _cart[index].prices.filter(
			(price) => price.interval === interval
		)[0];
		setCart(_cart);
	};

	const submitDiscountCode = () => {
		if (discountInput.length < 1) return;
		if (discountError.length > 1) return setDiscountError("");
		axios(`/api/store/discount/apply?code=${discountInput}`)
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
						break;
					case 403:
						setDiscountError("Minimum cart value not met.");
						break;
					default:
						console.log(
							`Unhandled discount error code: ${e.response.status}`
						);
				}
			});
	};

	const addToCart = async (item: CartItems) => {
		if (
			item.metadata?.type === "membership" &&
			cart.filter(
				(_item: CartItems) => _item.metadata?.type === "membership"
			).length >= 1
		)
			return alert(
				"Only one membership should be added to the cart. Remove the current membership item to add this one."
			);

		setCart((_items) => [..._items, item]);
	};

	return (
		<Container title="Shopping Cart" user={user}>
			<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
				<Title size="big">Shopping cart</Title>
			</div>
			<StoreBreadcrumb currentPage="cart" />

			<div className="flex justify-between">
				<div className="flex w-[73%] flex-col">
					<div className="h-max w-full rounded-lg px-4 py-3 dark:bg-dark-200">
						<Title size="small">Your items</Title>
						<div className="mt-2">
							{cart.map((item, i) => (
								<CartItem
									size="large"
									index={i}
									{...item}
									updateQuantity={updateQuantity}
									changeInterval={changeInterval}
									deleteItem={deleteItem}
								/>
							))}
						</div>
					</div>
					<div className="mt-5 h-max w-full rounded-lg px-4 py-3 dark:bg-dark-200">
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
							{cart.length >= 1 && (
								<OtherProduct
									{...cart[0]}
									addToCart={addToCart}
								/>
							)}
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
					<div className="my-5 h-max w-full rounded-lg px-8 py-7 dark:bg-dark-200">
						<Title size="small">Details</Title>
						<p className="mt-2 font-inter text-sm leading-tight text-light-600">
							Checkout is completed in USD, bank or card fees may
							apply to international payments. The total below is
							what is required to be paid upon checkout.
						</p>
						<div className="mt-3 mr-9 w-full">
							<h3 className="font-montserrat text-base font-bold">
								Apply a discount code
							</h3>
							<div className="group mt-2">
								<div className="flex flex-col justify-between text-black dark:text-white">
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
														{appliedSavings.toFixed(
															2
														)}
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
								</div>
							</div>
						</div>
						<div className="mt-3 flex w-full justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
							<Title size="small">Total:</Title>
							<Title size="small">
								${(totalCost - appliedSavings).toFixed(2)}
							</Title>
						</div>
						<Button
							size="medium"
							className="mt-3 w-full"
							onClick={() => router.push("/store/checkout")}
						>
							Continue to Checkout
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		const user = await ctx.req.session.get("user");

		if (!user) {
			return {
				redirect: {
					destination: `/api/auth/login?redirect=${encodeURIComponent(
						ctx.resolvedUrl
					)}`,
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
	}
);
