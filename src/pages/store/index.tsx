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
import ShoppingCart from "src/components/store/ShoppingCart";
import { toast } from "react-toastify";

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
	metadata: any;
};

export interface Metadata {
	type?: "subscription" | "single";
	hidden?: boolean;
	isGift?: string;
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
		const { data: products } = await axios("/api/store/products/one-time/list");
		setProducts(products);
	};

	const getSubscriptions = async () => {
		let { data: subscriptions } = await axios("/api/store/products/subscriptions/list");
		setSubscriptions(subscriptions);
	};

	const getCartContents = async () => {
		let { data: cartContents } = await axios("/api/store/cart/get");
		if (!cartContents.cart) return;
		setCartItems(cartContents.cart);
		if (cartContents.cart.length < 1) return;
		setTotalCost(
			cartContents.cart
				.reduce((acc: number, item: CartItem) => acc + (item.selectedPrice.price / 100) * item.quantity, 0)
				.toFixed(2)
		);
		setCartQuantities(cartContents.cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0));
	};

	const addToCart = async (item: CartItem) => {
		let toastMessage: string | undefined;
		const typeToAdd = item.metadata!.type;
		const cartHasSubscription = cartItems.filter((i) => i.metadata?.type === "subscription").length >= 1;
		const cartHasSingle = cartItems.filter((i) => i.metadata?.type === "single").length >= 1;

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

		if (typeToAdd === "subscription" && item.selectedPrice.interval!.length < 1)
			item.selectedPrice.interval = annualPricing ? "year" : "month";

		const alreadyExists = cartItems.findIndex((_item) => _item.id === item.id);
		if (alreadyExists !== -1) {
			let _cartItems = cartItems.slice();
			_cartItems[alreadyExists].quantity += 1;
			setCartItems(_cartItems);
		} else setCartItems((_items) => [..._items, item]);
	};

	const showProduct = (product: AnyProduct) => {
		if (product.metadata.type === "subscription") {
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
		if (cartItems.length < 1) {
			setTotalCost("0.00");
			setCartQuantities(0);
		} else {
			setTotalCost(
				cartItems
					.map((item: CartItem) => (item.selectedPrice.price / 100) * item.quantity)
					.reduce((a: number, b: number) => a + b)
					.toFixed(2)
			);
			setCartQuantities(cartItems.map((item: CartItem) => item.quantity).reduce((a: number, b: number) => a + b));
		}
	}, [cartItems]);

	return (
		<>
			{/* @ts-ignore */}
			{openModal && <Modal {...modalProps} />}
			<Container title="Store" user={user}>
				<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
					<Title size="big">Store</Title>
					<ShoppingCart
						totalCost={totalCost}
						cart={cartItems}
						setCart={setCartItems}
						label={
							cartQuantities >= 1
								? `${cartQuantities} item${cartQuantities === 1 ? "" : "s"} for $${totalCost}`
								: "Shopping cart"
						}
					/>
				</div>
				<div className="mt-4">
					<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="small">Subscriptions</Title>
						<div className="flex items-center justify-end">
							<p className="mr-2 text-sm text-neutral-900 dark:text-neutral-100">Annual pricing</p>
							<label
								htmlFor="annualPricing"
								onClick={() => setAnnualPricing(!annualPricing)}
								className="flex select-none items-center space-x-6 text-dark-500 dark:text-white"
							>
								<span
									className={clsx(
										"h-4 w-4 rounded-full",
										annualPricing ? "bg-dank-300" : "bg-gray-400 dark:bg-dank-400"
									)}
								/>
							</label>
						</div>
					</div>
					<div
						className="mt-4 grid justify-between gap-x-8 gap-y-7"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(208px, auto))", // 208px is the width of the product card
						}}
					>
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
					<div
						className={clsx(
							"mt-4 grid gap-x-8 gap-y-7",
							products.length < 5 ? "justify-start" : "justify-between"
						)}
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(208px, auto))", // 208px is the width of the product card
						}}
					>
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

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
