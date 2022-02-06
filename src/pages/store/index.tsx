import axios from "axios";
import router from "next/router";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import Stripe from "stripe";
import SimpleProduct from "src/components/store/SimpleProduct";
import clsx from "clsx";
import SubscriptionProduct from "src/components/store/SubscriptionProduct";
import { GetServerSideProps } from "next";
import { withSession } from "src/util/session";
import { authenticatedRoute } from "src/util/redirects";
import Modal from "src/components/store/Modal";

export interface Product extends Stripe.Product {
	price: number;
}

type Price = {
	id: string;
	price: number;
	interval: string;
};

type PriceInformation = {
	id: string;
	type: Stripe.Price.Type;
	interval?: Stripe.Price.Recurring.Interval;
	price: number;
};

interface Metadata {
	type?: "membership" | "lootbox";
}

export type CartItem = {
	id: string;
	name: string;
	selectedPrice: PriceInformation;
	prices: PriceInformation[];
	unit_cost: number;
	quantity: number;
	metadata?: Metadata;
	image?: string;
};

export interface AnyProduct extends Stripe.Product {
	prices: Price[];
}

export type ModalProps = {
	product: AnyProduct;
	annualPricing?: Boolean;
	addToCart: any;
	closeModal: any;
	titles: {
		included: string;
		additional?: string;
	};
	cta?: {
		text: string;
		callback: any;
	};
};

export default function StoreHome({ user }: PageProps) {
	const [openModal, setOpenModal] = useState(false);

	const [totalCost, setTotalCost] = useState<string>("...");
	const [cartQuantities, setCartQuantities] = useState(0);

	const [cartItems, setCartItems] = useState<CartItem[] | []>([]);
	const [subscriptions, setSubscriptions] = useState<AnyProduct[]>([]);
	const [products, setProducts] = useState<AnyProduct[]>([]);
	const [annualPricing, setAnnualPricing] = useState<Boolean>(false);

	const [modalProps, setModalProps] = useState<ModalProps>();

	const getProducts = async () => {
		const { data: products } = await axios(
			"/api/store/products/one-time/list"
		);
		setProducts(products);
	};

	const getSubscriptions = async () => {
		let { data: subscriptions } = await axios(
			"/api/store/products/subscriptions/list"
		);
		setSubscriptions(subscriptions);
	};

	const getCartContents = async () => {
		let { data: cartContents } = await axios("/api/store/cart/get");
		setCartItems(cartContents.cart);
		if (cartContents.cart.length < 1) return;
		setTotalCost(
			cartContents.cart
				.reduce(
					(acc: number, item: CartItem) =>
						acc + (item.selectedPrice.price / 100) * item.quantity,
					0
				)
				.toFixed(2)
		);
		setCartQuantities(
			cartContents.cart.reduce(
				(acc: number, item: CartItem) => acc + item.quantity,
				0
			)
		);
	};

	const addToCart = async (item: CartItem) => {
		if (
			item.metadata?.type === "membership" &&
			cartItems.filter(
				(_item: CartItem) => _item.metadata?.type === "membership"
			).length >= 1
		)
			return alert(
				"Only one membership should be added to the cart. Remove the current membership item to add this one."
			);

		if (
			item.metadata?.type === "membership" &&
			cartItems.filter(
				(_item: CartItem) => _item.metadata?.type === "membership"
			).length >= 1
		)
			return alert(
				"Only one membership should be added to the cart. Remove the current membership item to add this one."
			);

		if (
			item.metadata?.type !== "membership" &&
			cartItems.filter(
				(_item: CartItem) => _item.metadata?.type === "membership"
			).length >= 1
		)
			return alert(
				"If you are purchasing a subscription-modal based item, you may not also checkout with any other item during the same checkout session."
			);

		if (
			item.metadata?.type === "membership" &&
			item.selectedPrice.interval!.length < 1
		)
			item.selectedPrice.interval = annualPricing ? "year" : "month";

		const alreadyExists = cartItems.findIndex(
			(_item) => _item.id === item.id
		);
		if (alreadyExists !== -1) {
			let _cartItems = cartItems.slice();
			_cartItems[alreadyExists].quantity += 1;
			setCartItems(_cartItems);
		} else setCartItems((_items) => [..._items, item]);
	};

	const showProduct = (product: AnyProduct) => {
		if (product.metadata.type === "membership") {
			setModalProps({
				product,
				annualPricing,
				addToCart,
				closeModal: () => setOpenModal(false),
				titles: {
					included: "Exclusive benefits",
					additional: "Also included",
				},
				cta: {
					text: "Compare All Subscriptions",
					callback: () => {
						console.log("Do something");
					},
				},
			});
		} else {
			setModalProps({
				product,
				addToCart,
				closeModal: () => setOpenModal(false),
				titles: {
					included: "Potential items",
				},
			});
		}
		setOpenModal(true);
	};

	useEffect(() => {
		getProducts();
		getSubscriptions();
		getCartContents();
	}, []);

	useEffect(() => {
		if (products.length < 1) return;
		axios({
			url: "/api/store/cart/set",
			method: "PUT",
			data: { cartData: cartItems },
		});
		setTotalCost(
			cartItems
				.map((item: CartItem) => item.unit_cost * item.quantity)
				.reduce((a: number, b: number) => a + b)
				.toFixed(2)
		);
		setCartQuantities(
			cartItems
				.map((item: CartItem) => item.quantity)
				.reduce((a: number, b: number) => a + b)
		);
	}, [cartItems]);

	return (
		<>
			{/* @ts-ignore */}
			{openModal && <Modal {...modalProps} />}
			<Container title="Store" user={user}>
				<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
					<Title size="big">Store</Title>
					<Button
						size="small"
						className="w-full sm:w-auto"
						variant="dark"
						onClick={() => router.push(`/store/cart`)}
					>
						<div className="flex items-center space-x-2">
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M5 7h13.79a2 2 0 0 1 1.99 2.199l-.6 6A2 2 0 0 1 18.19 17H8.64a2 2 0 0 1-1.962-1.608L5 7z" />
									<path d="M5 7l-.81-3.243A1 1 0 0 0 3.22 3H2" />
									<path d="M8 21h2" />
									<path d="M16 21h2" />
								</svg>
							</div>
							<p>
								{cartQuantities >= 1
									? `${cartQuantities} item${
											cartQuantities === 1 ? "" : "s"
									  } for $${totalCost}`
									: "Shopping cart"}
							</p>
						</div>
					</Button>
				</div>
				<div className="mt-4">
					<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="small">Subscriptions</Title>
						<div className="flex items-center justify-center">
							<p className="mr-2 text-sm">Annual pricing</p>
							<label
								htmlFor="annualPricing"
								onClick={() => setAnnualPricing(!annualPricing)}
								className="flex select-none items-center space-x-6 text-dark-500 dark:text-white"
							>
								<span
									className={clsx(
										"absolute h-4 w-4 rounded-full",
										annualPricing
											? "bg-dank-300"
											: "bg-gray-400 dark:bg-dank-400"
									)}
								/>
								<span>{annualPricing}</span>
							</label>
						</div>
					</div>
					<div className="mt-4 grid grid-cols-1 place-content-stretch gap-y-7 gap-x-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
						{subscriptions.map((product) => (
							<>
								<SubscriptionProduct
									product={product}
									annualPricing={annualPricing}
									addToCart={addToCart}
									openModal={() => showProduct(product)}
								/>
							</>
						))}
					</div>
				</div>
				<div className="mt-8 mb-12">
					<Title size="small">In-game items</Title>
					<div className="mt-4 grid grid-cols-1 place-content-stretch gap-y-7 gap-x-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
						{products.map((product) => (
							<>
								<SimpleProduct
									product={product}
									contentsString={"View possible drops"}
									addToCart={addToCart}
									openModal={() => showProduct(product)}
								/>
							</>
						))}
					</div>
				</div>
			</Container>
		</>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
