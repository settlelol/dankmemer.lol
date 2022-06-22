import axios from "axios";
import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import Stripe from "stripe";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { withSession } from "src/util/session";
import { authenticatedRoute } from "src/util/redirects";
import Modal from "src/components/store/Modal";
import ShoppingCart from "src/components/store/ShoppingCart";
import { toast } from "react-toastify";
import PagedBanner, { BannerPage } from "src/components/store/PagedBanner";
import { UpsellProduct } from "./cart";
import PopularProduct from "src/components/store/PopularProduct";
import Product from "src/components/store/Product";
import { ProductDetails } from "../api/store/product/details";
import LoadingProduct from "src/components/store/LoadingProduct";

type PriceInformation = {
	id: string;
	type: Stripe.Price.Type;
	price: number;
	interval?: Stripe.Price.Recurring.Interval;
	metadata?: Metadata;
};

interface PossibleMetadata {
	type: ProductType;
	category: ProductCategory;
	hidden: "true" | "false";
	isGift: string;
	paypalPlan: string;
	giftProduct: string;
	mainProduct: string;
	mainInterval: string;
	ignoreWebhook: "true" | "false";
}

export type ProductType = "single" | "subscription" | "giftable";
export type ProductCategory =
	| "item pack"
	| "tool"
	| "collectable"
	| "power-up"
	| "drop item"
	| "sellable"
	| "lootbox"
	| "tradeable";
export type Metadata = Partial<PossibleMetadata>;

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

export type ListedProduct = Omit<ProductDetails, "body"> & { hidden: boolean; created: number };

export type ModalProps = {
	product: ListedProduct;
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
	const [modalProductId, setModalProductId] = useState("");
	const [openModal, setOpenModal] = useState(false);

	const [totalCost, setTotalCost] = useState<string>("...");
	const [cartQuantities, setCartQuantities] = useState(0);
	const [cartItems, setCartItems] = useState<CartItem[] | []>([]);

	const [popularProducts, setPopularProducts] = useState<UpsellProduct[]>([]);
	const [subscriptions, setSubscriptions] = useState<ListedProduct[]>([]);
	const [products, setProducts] = useState<ListedProduct[]>([]);

	const [bannerPages, setBannerPages] = useState<BannerPage[]>([]);

	const getBanners = async () => {
		try {
			const { data: visibleBanners } = await axios("/api/store/banners/list?active=true");
			setBannerPages(visibleBanners);
		} catch (e) {
			if (process.env.NODE_ENV === "development") {
				console.error(e);
			}
		}
	};

	const getAllProducts = async () => {
		try {
			let ProductsAPI = axios.create({
				baseURL: "/api/store/products/",
			});
			axios
				.all([
					ProductsAPI.get("/popular"),
					ProductsAPI.get("/one-time/list"),
					ProductsAPI.get("/subscriptions/list"),
				])
				.then(
					axios.spread(async ({ data: popularProds }, { data: singles }, { data: subscriptions }) => {
						setPopularProducts(popularProds);
						setProducts(singles);
						setSubscriptions(subscriptions);
					})
				);
		} catch (e) {
			if (process.env.NODE_ENV === "development") {
				console.error(e);
			}
		}
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

		const alreadyExists = cartItems.findIndex((_item) => _item.id === item.id);
		if (alreadyExists !== -1) {
			let _cartItems = cartItems.slice();
			_cartItems[alreadyExists].quantity += 1;
			setCartItems(_cartItems);
		} else setCartItems((_items) => [..._items, item]);
	};

	const addProductById = async (id: string) => {
		try {
			const { data: formatted } = await axios(`/api/store/product/find?id=${id}&action=format&to=cart-item`);
			addToCart(formatted);
		} catch (e) {
			console.error(e);
			toast.error("We were unable to update your cart information. Please try again later.");
		}
	};

	useEffect(() => {
		getBanners();
		getAllProducts();
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

	useEffect(() => {
		if (modalProductId && modalProductId.length >= 1) {
			setOpenModal(true);
		} else {
			setOpenModal(false);
		}
	}, [modalProductId]);

	return (
		<>
			{openModal && (
				<Modal
					productId={modalProductId}
					add={() => addProductById(modalProductId)}
					close={() => setModalProductId("")}
				/>
			)}
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
				{bannerPages.length >= 1 && (
					<div className="mt-3">
						<PagedBanner pages={bannerPages} height={"h-72"} />
					</div>
				)}
				<section className="mt-14">
					<Title size="medium" className="font-semibold">
						Popular products
					</Title>
					<div className="overflow-y-visible overflow-x-scroll xl:overflow-visible">
						<div className="mt-3 flex min-w-[1280px] justify-between space-x-10 xl:min-w-[unset]">
							{popularProducts.length >= 1
								? popularProducts.map((product) => (
										<PopularProduct
											key={product.id}
											product={product}
											add={() => addProductById(product.id)}
											openModal={() => setModalProductId(product.id)}
										/>
								  ))
								: Array(3)
										.fill(0)
										.map(() => <LoadingProduct variant="popular" />)}
						</div>
					</div>
				</section>
				<section className="mt-4">
					<div className="mt-12 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="medium" className="font-semibold">
							Subscriptions
						</Title>
					</div>
					<div
						className="col-auto mt-4 grid place-items-center justify-center gap-x-8 gap-y-7 phone:justify-between"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
						}}
					>
						{subscriptions.length >= 1
							? subscriptions.map((product) => (
									<Product
										key={product.id}
										product={product}
										add={() => addProductById(product.id)}
										openModal={() => setModalProductId(product.id)}
									/>
							  ))
							: Array(5)
									.fill(0)
									.map(() => <LoadingProduct variant="normal" />)}
					</div>
				</section>
				<div className="mt-12 mb-12">
					<Title size="medium" className="text-center font-semibold phone:text-left">
						Items
					</Title>
					<div
						className={clsx(
							"mt-4 grid gap-x-8 gap-y-7",
							products.length >= 1 && products.length < 5
								? "justify-start"
								: "justify-center phone:justify-between"
						)}
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(224px, auto))", // 224px is the width of the product card
						}}
					>
						{products.length >= 1
							? products.map((product) => (
									<Product
										key={product.id}
										product={product}
										add={() => addProductById(product.id)}
										openModal={() => setModalProductId(product.id)}
									/>
							  ))
							: Array(5)
									.fill(0)
									.map(() => <LoadingProduct variant="normal" />)}
					</div>
				</div>
			</Container>
		</>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
