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
import { useRouter } from "next/router";

export default function Cart({ user }: PageProps) {
	const router = useRouter();

	const [loaded, setLoaded] = useState(false);
	const [cart, setCart] = useState<CartItems[]>([]);
	const [totalCost, setTotalCost] = useState<string | number>(0);

	useEffect(() => {
		axios("/api/store/cart/get").then(({ data }) => {
			setLoaded(true);
			setCart(data.cart);
		});
	}, []);

	useEffect(() => {
		if (!loaded) return;
		axios({
			url: "/api/store/cart/set",
			method: "PUT",
			data: { cartData: cart },
		});
		setTotalCost(
			cart
				.map(
					(item: CartItems) =>
						(item.price.type === "recurring"
							? item.price.interval === "year"
								? item.unit_cost * 10.8 // 10.8 is just 12 months (x12) with a 10% discount
								: item.unit_cost
							: item.unit_cost) * item.quantity
				)
				.reduce((a, b) => a + b)
				.toFixed(2)
		);
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
			<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
				<Title size="big">Shopping cart</Title>
			</div>
			<div className="flex justify-between">
				<div className="flex w-[73%] flex-col">
					<div className="h-max w-full rounded-lg px-4 py-3 dark:bg-dark-200">
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
						<div className="mt-3 flex w-full justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
							<Title size="small">Total:</Title>
							<Title size="small">${totalCost}</Title>
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

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
