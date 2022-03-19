import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { withSession } from "src/util/session";
import { useRouter } from "next/router";
import { Session } from "next-iron-session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import CartItemImmutable from "src/components/store/checkout/CartItemImmutable";
import Button from "src/components/ui/Button";
import { Icon as Iconify } from "@iconify/react";
import PayPal from "src/util/paypal";
import { OrdersRetrieveResponse } from "src/util/paypal/classes/Orders";
import clsx from "clsx";

interface BuyerDetails {
	discordId: string;
	email: string;
}

interface InvoiceItems {
	type: Stripe.InvoiceLineItem.Type;
	name: string;
	price: number;
	quantity: number;
	metadata: any;
	image: string;
}

interface InvoiceSubscription extends InvoiceItems {
	interval?: Stripe.Price.Recurring.Interval;
	endsAt?: number;
}

interface Invoice {
	buyer: BuyerDetails;
	items: InvoiceItems[] | InvoiceSubscription[];
	total: number;
	metadata: any;
	salesTax: number;
}

interface Props extends PageProps {
	paymentGateway: "stripe" | "paypal";
	invoice: Invoice;
}

export default function Success({ paymentGateway, invoice, user }: Props) {
	const router = useRouter();

	useEffect(() => {
		// Use this when page is done ;)
		// router.replace("/store/checkout/success")
	}, []);

	return (
		<Container title="Successful purchase" user={user}>
			<div className="mb-24 grid place-items-center">
				<div className="mt-12 mb-5 flex w-2/5 flex-col">
					<Title size="big">Purchase Summary</Title>
					<p className="my-2 text-neutral-400">
						Thank you for your purchase, your payment has been
						successful! You should receive your purchased goods
						within 5 minutes of purchase.
					</p>
				</div>
				<div className="relative box-border grid h-[587px] w-2/5 place-items-center overflow-hidden">
					<div className="relative h-full w-full max-w-4xl">
						<div className="relative h-full w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
							<div className="flex h-full flex-col items-end justify-between">
								<div className="w-full">
									<div className="flex justify-between">
										<div
											className={clsx(
												"flex flex-col",
												JSON.parse(
													invoice.metadata
														.paymentIntent.isGift
												)
													? "w-1/2"
													: "w-full"
											)}
										>
											<h3 className="font-montserrat text-base font-bold text-black dark:text-white">
												Purchased by
											</h3>
											<p className="text-sm text-light-600 dark:text-neutral-200">
												Account:{" "}
												<span className="text-dank-200">
													{invoice.buyer.discordId}
												</span>
											</p>
											<p className="text-sm text-light-600 dark:text-neutral-200">
												Email:{" "}
												<span className="text-dank-200">
													{invoice.buyer.email}
												</span>
											</p>
										</div>
										{JSON.parse(
											invoice.metadata.paymentIntent
												.isGift
										) && (
											<div className="flex w-2/5 flex-col">
												<h3 className="font-montserrat text-base font-bold text-black dark:text-white">
													Purchased for
												</h3>
												<p className="text-sm text-neutral-200">
													Account ID:
													<br />
													<span className="text-dank-200">
														{
															invoice.metadata
																.paymentIntent
																.giftFor
														}
													</span>
												</p>
											</div>
										)}
									</div>
									<div className="mt-4 flex flex-col">
										<h3 className="font-montserrat text-base font-bold text-black dark:text-white">
											Items purchased
										</h3>
										<div className="flex flex-col">
											{invoice.items.map((item) => (
												<CartItemImmutable
													name={item.name}
													// @ts-ignore
													selectedPrice={{
														// @ts-ignore
														interval: item.interval,
													}}
													unit_cost={item.price / 100}
													quantity={
														item.quantity || 1
													}
													metadata={item.metadata}
													image={item.image}
												/>
											))}
										</div>
									</div>
								</div>
								<div className="flex w-max flex-col justify-start">
									<div className="mt-3">
										<p className="text-right text-sm text-neutral-300/50">
											Added sales tax: $
											{(invoice.salesTax / 100).toFixed(
												2
											)}
										</p>
										<div className="mt-1 flex w-full min-w-[260px] justify-between rounded-lg bg-neutral-300 px-4 py-3 dark:bg-dank-500">
											<Title size="small">Total:</Title>
											<Title size="small">
												$
												{(invoice.total / 100).toFixed(
													2
												)}
											</Title>
										</div>
									</div>
									<div className="mt-2 flex w-full items-center justify-end">
										<Link href="/store">
											<a className="mr-3 flex h-max items-center justify-center text-sm text-neutral-400 transition-colors hover:text-dank-100">
												<Iconify
													icon="bx:bxs-store"
													color="currentColor"
													className="mt-[1px] mr-2"
												/>
												Go to store
											</a>
										</Link>
										<Button size="medium">
											Return home
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="mt-3 rounded-full bg-dank-300/40 px-3 py-1 dark:bg-dank-400/50">
					<p className="text-xs text-neutral-800 dark:text-neutral-300">
						Your payment was securely processed by{" "}
						{paymentGateway === "stripe" ? "Stripe" : "PayPal"}
					</p>
				</div>
			</div>
		</Container>
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

		if (!ctx.query.id) {
			return {
				redirect: {
					destination: "/store",
					permanent: false,
				},
			};
		}

		let salesTax: number = 0;
		const paymentGateway = ctx.query.gateway?.toString().toLowerCase();
		const stripe = stripeConnect();
		const paypal = new PayPal();

		if (paymentGateway === "stripe") {
			const invoice = await stripe.invoices.retrieve(
				ctx.query.id.toString(),
				{ expand: ["payment_intent"] }
			);

			const { data: invoiceItems } = await stripe.invoices.listLineItems(
				invoice.id
			);
			let items: InvoiceItems[] | InvoiceSubscription[] = [];

			const paymentIntent = await stripe.paymentIntents.retrieve(
				// @ts-ignore
				invoice.payment_intent!.id
			);

			let subscription: Stripe.Subscription | null = null;
			if (invoiceItems[0].type === "subscription") {
				subscription = await stripe.subscriptions.retrieve(
					// @ts-ignore
					invoiceItems[0].subscription
				);
			}

			if (invoice.metadata!.boughtByDiscordId !== user.id) {
				return {
					redirect: {
						destination: "/store",
						permanent: false,
					},
				};
			}

			for (let i = 0; i < invoiceItems.length; i++) {
				const item = invoiceItems[i];
				// @ts-ignore
				const product = await stripe.products.retrieve(
					item.price?.product as string
				);

				if (product.name.includes("Product for invoice item ")) {
					salesTax = item.amount;
				} else {
					if (item.type === "invoiceitem") {
						items.push({
							type: item.type,
							name: product.name,
							price: item.price?.unit_amount!,
							quantity: item.quantity!,
							metadata: product.metadata,
							image: product.images[0] || "",
						});
					} else {
						items.push({
							type: item.type,
							name: product.name,
							price: subscription!.items.data[0].price
								.unit_amount!,
							quantity: 1,
							interval:
								subscription!.items.data[0].price.recurring
									?.interval!,
							endsAt: subscription!.current_period_end,
							metadata: product.metadata,
							image: product.images[0],
						});
					}
				}
			}

			return {
				props: {
					paymentGateway,
					invoice: {
						buyer: {
							discordId: invoice.metadata!.boughtByDiscordId,
							email: paymentIntent.receipt_email,
						},
						items,
						subtotal: invoice.subtotal,
						total: invoice.total,
						metadata: {
							invoice: invoice.metadata,
							paymentIntent: paymentIntent.metadata,
						},
						salesTax,
					},
					user,
				},
			};
		} else if (paymentGateway === "paypal") {
			const order = (await paypal.orders.retrieve(
				ctx.query.id.toString()
			)) as OrdersRetrieveResponse;

			let items: InvoiceItems[] | InvoiceSubscription[] = [];
			const purchasedItems = order.purchase_units[0].items;
			for (let i = 0; purchasedItems.length > i; i++) {
				const item = purchasedItems[i];
				if (item.name === "Sales tax") {
					salesTax = parseFloat(item.unit_amount.value) * 100;
				} else {
					const product = await stripe.products.retrieve(
						item.sku.split(":")[0]
					);
					items.push({
						type: "invoiceitem", // TODO: Paypal subscriptions
						name: item.name,
						price: parseFloat(item.unit_amount.value) * 100,
						quantity: parseInt(item.quantity),
						metadata: product.metadata,
						image: product.images[0],
					});
				}
			}

			return {
				props: {
					paymentGateway,
					invoice: {
						buyer: {
							discordId:
								order.purchase_units[0].custom_id!.split(
									":"
								)[0],
							email: order.payer.email_address,
						},
						items,
						subtotal: order.purchase_units[0].amount.value,
						total:
							parseFloat(order.purchase_units[0].amount.value!) *
							100,
						metadata: {
							invoice: "invoice.metadata",
							paymentIntent: {
								isGift: JSON.parse(
									order.purchase_units[0].custom_id!.split(
										":"
									)[2]
								),
								giftFor:
									order.purchase_units[0].custom_id!.split(
										":"
									)[1],
							},
						},
						salesTax,
					},
					user,
				},
			};
		}
	}
);
