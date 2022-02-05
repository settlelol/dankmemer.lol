import axios from "axios";
import { GetServerSideProps } from "next";

import { useEffect, useState } from "react";
import { Title } from "src/components/Title";
import Container from "src/components/ui/Container";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { CartItem as CartItems } from "..";
import { useRouter } from "next/router";

export default function Checkout({ user }: PageProps) {
	const router = useRouter();
	const [clientSecret, setClientSecret] = useState("");
	const [paymentIntentId, setPaymentIntentId] = useState("");

	const [cart, setCart] = useState<CartItems[]>([]);

	const [subtotalCost, setSubtotalCost] = useState<number>(0);

	useEffect(() => {}, []);

	return (
		<Container title="Successful purchase" user={user}>
			<div className="mb-16 grid place-items-center">
				<div className="mt-12 mb-5 flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
					<Title size="big">Purchase Complete</Title>
				</div>
				<div className="flex justify-between">
					<div className="relative ml-5 h-[587px] w-full">
						<div className="relative h-full w-full rounded-lg bg-light-500 px-8 py-7 dark:bg-dark-200">
							<Title size="small">Shopping cart</Title>
							<div className="flex h-full flex-col items-end justify-between pb-7">
								<div className="w-full"></div>
								<div className="mt-3 flex w-full max-w-[260px] justify-between rounded-lg px-4 py-3 dark:bg-dank-500">
									<Title size="small">Subtotal:</Title>
									<Title size="small">${subtotalCost}</Title>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
