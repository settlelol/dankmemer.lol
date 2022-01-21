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

interface Product extends Stripe.Product {
	price: number;
}

export default function StoreHome({ user }: PageProps) {
	const [cartItems, setCartItems] = useState([]);
	const [subscriptions, setSubscriptions] = useState([]);
	const [products, setProducts] = useState<Product[]>([]);

	const getProducts = async () => {
		const { data: products } = await axios(
			"/api/store/products/one-time/list"
		);
		setProducts(products);
	};

	const getSubscriptions = async () => {
		const { data: subscriptions } = await axios(
			"/api/store/products/subscriptions/list"
		);
		setSubscriptions(subscriptions);
	};

	useEffect(() => {
		getProducts();
		getSubscriptions();
	}, []);

	return (
		<Container title="Store">
			<div className="flex flex-col sm:flex-row justify-between items-center mt-12 space-y-2 sm:space-y-0">
				<Title size="big">Store</Title>
				<Button
					size="small"
					className="w-full sm:w-auto"
					variant="dark"
					onClick={() => router.push(`/@${user?.id}`)}
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
									? `1 Item for`
									: `${cartItems.length} items for`
								: "Shopping cart"}
						</p>
					</div>
				</Button>
			</div>
			<div className="mt-4">
				<Title size="small">Subscriptions</Title>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-y-7 gap-x-7 mt-4 place-content-stretch">
					{subscriptions.map(({ name, images, price }) => (
						<>
							<SimpleProduct
								name={name}
								image={images[0]}
								price={price / 100}
							/>
						</>
					))}
				</div>
			</div>
			<div className="mt-4 mb-12">
				<Title size="small">In-game items</Title>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-y-7 gap-x-7 mt-4 place-content-stretch">
					{products.map(({ name, images, price }) => (
						<>
							<SimpleProduct
								name={name}
								image={images[0]}
								price={price / 100}
							/>
						</>
					))}
				</div>
			</div>
		</Container>
	);
}
