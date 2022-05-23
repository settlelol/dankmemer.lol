import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";

import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { withSession } from "src/util/session";
import { CartItem as CartItems } from "..";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import CartItemImmutable from "src/components/store/checkout/CartItemImmutable";
import CheckoutForm from "src/components/store/checkout/CheckoutForm";
import StoreBreadcrumb from "src/components/store/StoreBreadcrumb";
import { Session } from "next-iron-session";
import Link from "next/link";

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

interface Props extends PageProps {
	cartData: CartItems[];
}

export default function Checkout({ cartData, user }: Props) {
	const [clientSecret, setClientSecret] = useState("");
	const [invoiceId, setInvoiceId] = useState("");

	const [stripeElementsOptions, setStripeElementsOptions] =
		useState<StripeElementsOptions>();

	const [subtotalCost, setSubtotalCost] = useState<string>("");
	const [displayWarning, setDisplayWarning] = useState(false);

	useEffect(() => {
		setSubtotalCost(
			cartData
				.reduce(
					(acc: number, item: CartItems) =>
						acc + (item.selectedPrice.price / 100) * item.quantity,
					0
				)
				.toFixed(2)
		);

		axios("/api/store/checkout/setup")
			.then(({ data }) => {
				setStripeElementsOptions({
					..._stripeElementsOptions,
					clientSecret: data.client_secret,
				});
				setInvoiceId(data.invoice);
				setClientSecret(data.client_secret);
			})
			.catch((e) => {
				console.error(e);
			});
	}, []);

	return (
		<Elements stripe={stripePromise} options={stripeElementsOptions}>
			<Container title="Checkout" user={user}>
				<div className="mb-36 lg:mb-16">
					<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
						<Title size="big">Checkout</Title>
					</div>
					<StoreBreadcrumb currentPage="checkout" />
					{displayWarning && (
						<div className="my-5 grid w-full place-items-center rounded-lg border-2 border-red-500 bg-red-500/50 py-2 text-black dark:bg-red-500/25 dark:text-white">
							<p className="max-w-3xl text-center">
								Due to specific limitations, we are unable to
								offer discounts for subscriptions, nor the
								ability to gift subscriptions to other users
								through PayPal. We encourage you to{" "}
								<Link href="#">
									<a
										className="underline"
										onClick={() =>
											alert(
												"Go to a blog post or something"
											)
										}
									>
										read more about it here
									</a>
								</Link>
								.
							</p>
						</div>
					)}
					<div className="flex flex-1 flex-col justify-between lg:flex-row">
						<CheckoutForm
							clientSecret={clientSecret}
							invoiceId={invoiceId}
							userId={user!.id}
							userEmail={user!.email}
							itemsTotal={subtotalCost}
							subtotalCost={(
								parseFloat(subtotalCost) +
								parseFloat(subtotalCost) * 0.0675
							).toFixed(2)}
							showWarning={setDisplayWarning}
							cart={cartData}
						/>
						<div className="relative hidden w-full lg:ml-5 lg:block">
							<div className="relative h-full w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
								<Title size="small">Shopping cart</Title>
								<div className="flex h-full flex-col items-end justify-between pb-7">
									<div className="w-full">
										{cartData.map((item, i) => (
											<CartItemImmutable
												index={i}
												{...item}
											/>
										))}
									</div>
									<div>
										<p className="text-right text-sm text-neutral-600 dark:text-neutral-300/50">
											Added sales tax: $
											{(
												parseFloat(subtotalCost) *
												0.0675
											).toFixed(2)}
										</p>
										<div className="flex w-full max-w-[260px] justify-between space-x-2 rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
											<Title size="small">
												Subtotal:
											</Title>
											<Title size="small">
												$
												{(
													parseFloat(subtotalCost) +
													parseFloat(subtotalCost) *
														0.0675
												).toFixed(2)}
											</Title>
										</div>
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
