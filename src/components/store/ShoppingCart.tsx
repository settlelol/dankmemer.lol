import { useRouter } from "next/router";
import { useState } from "react";
import { CartItem as CartItems } from "src/pages/store";
import { Title } from "../Title";
import Button from "../ui/Button";
import CartItem from "./cart/CartItem";

interface Props {
	totalCost: string;
	cart: CartItems[];
	setCart: any;
	label: String;
}

export default function ShoppingCart({
	totalCost,
	cart,
	setCart,
	label,
}: Props) {
	const router = useRouter();
	const [showCart, setShowCart] = useState(false);
	// Thanks badosz
	let timeout: NodeJS.Timeout;

	const deleteItem = (index: number) => {
		const _cart = [...cart];
		_cart.splice(index, 1);
		setCart(_cart);
		if (_cart.length < 1) setShowCart(false);
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

	const buttonEnter = () => {
		timeout = setTimeout(() => {
			setShowCart(true);
		}, 200);
	};

	const buttonLeave = () => {
		clearTimeout(timeout);
		setShowCart(false);
	};

	return (
		<div onMouseEnter={buttonEnter} onMouseLeave={buttonLeave}>
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
					<p>{label}</p>
				</div>
			</Button>
			{showCart &&
				(cart.length >= 1 ? (
					<div className="absolute right-0 z-50 pt-2 motion-safe:animate-slide-in">
						<div className="w-96 rounded-md bg-neutral-300 py-3 px-4 dark:bg-dank-600">
							<Title size="small">Your cart</Title>
							<div className="flex flex-col">
								<div>
									{cart.map((item, i) => (
										<CartItem
											size="small"
											index={i}
											{...item}
											changeInterval={changeInterval}
											updateQuantity={updateQuantity}
											deleteItem={deleteItem}
										/>
									))}
								</div>
								<div className="mt-5 flex justify-end">
									<div className="flex w-2/3 flex-col">
										<div className="flex w-full justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
											<Title size="small">Total:</Title>
											<Title size="small">
												${totalCost}
											</Title>
										</div>
										<Button
											className="mt-2 w-full"
											onClick={() =>
												router.push("/store/cart")
											}
										>
											Review cart
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="absolute right-0 z-50 pt-2">
						<div className="w-96 rounded-md bg-neutral-300 py-2 px-3 dark:bg-dank-600">
							<h4 className="text-lg font-bold">Your cart</h4>
							<div className="my-6 flex flex-col">
								<p className="mx-auto w-3/4 text-center opacity-50">
									You don't have anything in your cart, add
									something from the store for it to show up
									here!
								</p>
							</div>
						</div>
					</div>
				))}
		</div>
	);
}
