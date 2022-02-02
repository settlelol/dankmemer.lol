import axios from "axios";
import { GetServerSideProps } from "next";
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

export default function Cart({ user }: PageProps) {
	const [cart, setCart] = useState<CartItems[]>([]);

	useEffect(() => {
		axios("/api/store/cart/get").then(({ data }) => {
			setCart(data.cart);
		});
	}, []);

	useEffect(() => {
		axios({
			url: "/api/store/cart/set",
			method: "PUT",
			data: { cartData: cart },
		});
	}, [cart]);

	const updateQuantity = (index: number, quantity: number) => {
		const _cart = [...cart];
		_cart[index].quantity = quantity;
		setCart(_cart);
	};

	const changeInterval = (index: number, interval: "month" | "year") => {
		const _cart = [...cart];
		_cart[index].price.interval = interval;
		setCart(_cart);
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
			<GoBack />
			<div className="flex flex-col sm:flex-row justify-between items-center mt-12 mb-5 space-y-2 sm:space-y-0">
				<Title size="big">Shopping cart</Title>
			</div>
			<div className="flex justify-between">
				<div className="flex flex-col w-[73%]">
					<div className="px-4 py-3 w-full h-max dark:bg-dark-200 rounded-lg">
						<Title size="small">Your items</Title>
						<div className="mt-2">
							{cart.map((item, i) => (
								<CartItem
									index={i}
									{...item}
									updateQuantity={updateQuantity}
									changeInterval={changeInterval}
								/>
							))}
						</div>
					</div>
					<div className="mt-5 px-4 py-3 w-full h-max dark:bg-dark-200 rounded-lg">
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
				<div className="flex flex-col w-80">
					<MarketingBox
						color="blue"
						title="Extra Savings"
						topText="Unlock more savings by purchasing an annual subscription!"
						bottomText="When purchasing a subscription you are able to save up to 10% by switching to annual subscription rather than a monthly subscription."
					/>
					<div className="my-5 px-8 py-7 w-full h-max dark:bg-dark-200 rounded-lg">
						<Title size="small">Details</Title>
						<p className="mt-2 font-inter text-light-600 leading-tight text-sm">
							Checkout is completed in USD, bank or card fees may
							apply to international payments. The total below is
							what is required to be paid upon checkout.
						</p>
						<div className="flex justify-between mt-3 px-4 py-3 dark:bg-dank-500 w-full rounded-lg">
							<Title size="small">Total:</Title>
							<Title size="small">
								{cart.length >= 1
									? cart.length === 1
										? `$${cart
												.map(
													(item: CartItems) =>
														(item.price.type ===
														"recurring"
															? item.price
																	.interval ===
															  "year"
																? item.unit_cost *
																  10.8
																: item.unit_cost
															: item.unit_cost) *
														item.quantity
												)
												.reduce((a, b) => a + b)
												.toFixed(2)}`
										: `$${cart
												.map(
													(item: CartItems) =>
														(item.price.type ===
														"recurring"
															? item.price
																	.interval ===
															  "year"
																? item.unit_cost *
																  10.8
																: item.unit_cost
															: item.unit_cost) *
														item.quantity
												)
												.reduce((a, b) => a + b)
												.toFixed(2)}`
									: "..."}
							</Title>
						</div>
						<Button
							size="medium"
							className="mt-3 w-full"
							onClick={() => console.log("a")}
						>
							Continue to Checkout
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
