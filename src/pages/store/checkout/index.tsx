import axios from "axios";
import { GetServerSideProps } from "next";

import { useEffect, useRef, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { CartItem as CartItems } from "..";
import { useRouter } from "next/router";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import CartItemImmutable from "src/components/store/checkout/CartItemImmutable";
import CheckoutForm from "src/components/store/checkout/CheckoutForm";

const _stripeElementsOptions: StripeElementsOptions = {};

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export interface DiscountItem {
	id: string;
	type: "one_time" | "recurring";
	originalCost: number;
	discountedCost: number;
	savings: number;
}

export default function Checkout({ user }: PageProps) {
	const router = useRouter();
	const [clientSecret, setClientSecret] = useState("");
	const [paymentIntentId, setPaymentIntentId] = useState("");
	const [invoiceId, setInvoiceId] = useState("");

	const [stripeElementsOptions, setStripeElementsOptions] =
		useState<StripeElementsOptions>();
	const [cart, setCart] = useState<CartItems[]>([]);

	const [subtotalCost, setSubtotalCost] = useState<number>(0);

	useEffect(() => {
		axios("/api/store/checkout/setup")
			.then(({ data }) => {
				setStripeElementsOptions({
					..._stripeElementsOptions,
					clientSecret: data.client_secret,
				});
				setInvoiceId(data.invoice);
				setClientSecret(data.client_secret);
				setPaymentIntentId(data.payment_intent);
			})
			.catch((e) => {
				console.error(e);
			});

		axios("/api/store/cart/get").then(({ data }) => {
			setCart(data.cart);
			setSubtotalCost(
				data.cart
					.reduce(
						(acc: number, item: CartItems) =>
							acc + item.selectedPrice.price * item.quantity,
						0
					)
					.toFixed(2)
			);
		});
	}, []);

	return (
		<Elements stripe={stripePromise} options={stripeElementsOptions}>
			<Container title="Checkout" user={user}>
				<div className="mb-16">
					<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="big">Checkout</Title>
					</div>
					<div className="flex justify-between">
						<CheckoutForm
							clientSecret={clientSecret}
							paymentIntentId={paymentIntentId}
							invoiceId={invoiceId}
							userEmail={user!.email}
							subtotalCost={subtotalCost}
							cart={cart}
						/>
						<div className="relative ml-5 h-[587px] w-full">
							<div className="relative h-full w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
								<Title size="small">Shopping cart</Title>
								<div className="flex h-full flex-col items-end justify-between pb-7">
									<div className="w-full">
										{cart.map((item, i) => (
											<CartItemImmutable
												index={i}
												{...item}
											/>
										))}
									</div>
									<div className="mt-3 flex w-full max-w-[260px] justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
										<Title size="small">Subtotal:</Title>
										<Title size="small">
											${subtotalCost}
										</Title>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</Elements>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
