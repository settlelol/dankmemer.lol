import axios from "axios";
import router from "next/router";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

type SubscriptionPrice = {
	id: string;
	price: number;
	interval: string;
};

type PriceInformation = {
	type: Stripe.Price.Type;
	interval?: Stripe.Price.Recurring.Interval;
};

export interface Subscription extends Stripe.Product {
	prices: SubscriptionPrice[];
}

interface Metadata {
	type?: "membership";
}

type CartItem = {
	id: string;
	name: string;
	price: PriceInformation;
	unit_cost: number;
	quantity: number;
	metadata?: Metadata;
};

type ModalProps = {
	product: Product | Subscription;
	annualPricing?: Boolean;
	addToCart: any;
	closeModal: any;
	cta?: {
		text: string;
		callback: any;
	};
};

export default function StoreHome({ user }: PageProps) {
	const [openModal, setOpenModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState<Product | Subscription>();

	const [cartItems, setCartItems] = useState<CartItem[] | []>([]);
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
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
		setCartItems((_items) => [..._items, item]);
	};

	const showProduct = (product: Product | Subscription) => {
		setSelectedItem(product);

		if (product.metadata.type === "membership") {
			setModalProps({
				product,
				annualPricing,
				addToCart,
				closeModal: () => setOpenModal(false),
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
			});
		}
		setOpenModal(true);
	};

	useEffect(() => {
		getProducts();
		getSubscriptions();
	}, []);

	return (
		<>
			{/* @ts-ignore */}
			{openModal && <Modal {...modalProps} />}
			<Container title="Store">
				<div className="flex flex-col sm:flex-row justify-between items-center mt-12 space-y-2 sm:space-y-0">
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
								{cartItems.length >= 1
									? cartItems.length === 1
										? `1 Item for $${cartItems
												.map(
													(item: CartItem) =>
														item.unit_cost *
														item.quantity
												)
												.reduce((a, b) => a + b)
												.toFixed(2)}`
										: `${
												cartItems.length
										  } items for $${cartItems
												.map(
													(item: CartItem) =>
														item.unit_cost *
														item.quantity
												)
												.reduce((a, b) => a + b)
												.toFixed(2)}`
									: "Shopping cart"}
							</p>
						</div>
					</Button>
				</div>
				<div className="mt-4">
					<div className="flex flex-col sm:flex-row justify-between items-center mt-12 space-y-2 sm:space-y-0">
						<Title size="small">Subscriptions</Title>
						<div className="flex justify-center items-center">
							<p className="text-sm mr-2">Annual pricing</p>
							<label
								htmlFor="annualPricing"
								onClick={() => setAnnualPricing(!annualPricing)}
								className="flex items-center space-x-6 select-none text-dark-400 dark:text-white"
							>
								<span
									className={clsx(
										"absolute rounded-full h-4 w-4",
										annualPricing
											? "bg-dank-300"
											: "bg-gray-400 dark:bg-dank-400"
									)}
								/>
								<span>{annualPricing}</span>
							</label>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-y-7 gap-x-7 mt-4 place-content-stretch">
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
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-y-7 gap-x-7 mt-4 place-content-stretch">
						{products.map((product) => (
							<>
								<SimpleProduct
									product={product}
									contentsString={"View possible drops"}
									addToCart={addToCart}
									openModal={() => showProduct(product)}
								/>
								<SimpleProduct
									product={product}
									contentsString={"View possible drops"}
									addToCart={addToCart}
									openModal={() => showProduct(product)}
								/>
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
