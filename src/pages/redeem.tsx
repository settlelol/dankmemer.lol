import axios from "axios";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-iron-session";
import { useState } from "react";
import { toast } from "react-toastify";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Container from "src/components/ui/Container";
import { User, UserData } from "src/types";
import { dbConnect } from "src/util/mongodb";
import { withSession } from "src/util/session";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";

interface Props {
	user: User;
	gift: Gift;
}

interface Gift {
	from: string;
	code: string;
	product: Product;
}

interface Product {
	name: string;
	image: string;
	price: Price;
}

interface Price {
	interval: Stripe.Price.Recurring.Interval;
	interval_count: number;
}

export default function Redeem({ gift, user }: Props) {
	const [redeeming, setRedeeming] = useState(false);

	const redeem = async () => {
		setRedeeming(true);
		try {
			await axios(`/api/gifts/${gift}/claim`);
			toast.success(
				"You have successfully redeemed your gift! If you do not receive your gift within a few hours, contact support.",
				{
					theme: "colored",
					position: "top-center",
				}
			);
		} catch (e) {
			toast.error("Unable to claim your gift. Please try again later.", {
				theme: "colored",
				position: "top-center",
			});
		} finally {
			setRedeeming(false);
		}
	};

	return (
		<Container title="Redeem gift" user={user}>
			<div className="grid w-full place-items-center">
				<div className="relative mt-5 h-48 w-1/2 rounded-lg py-5 px-6 dark:bg-dank-500">
					<Title size="medium">You have received a gift!</Title>
					<div className="mt-2 flex items-center justify-start space-x-3">
						<div
							className="min-h-[4rem] min-w-[4rem] rounded-md bg-black/10 bg-[length:48px_48px] bg-center bg-no-repeat dark:bg-black/30"
							style={{
								backgroundImage: `url('${gift.product.image}')`,
							}}
						/>
						<div>
							<p className="dark:text-neutral-400">
								You have been graciously gifted a{" "}
								<span className="text-dank-300">{gift.product.name}</span> from{" "}
								<span className="dark:text-neutral-200">{gift.from}</span>! Your gifted subscription
								will last {gift.product.price.interval_count} {gift.product.price.interval}
								{gift.product.price.interval_count !== 1 ? "s" : ""} <u>from the time you redeem it.</u>
							</p>
						</div>
					</div>

					<div className="absolute left-0 bottom-0 flex w-full justify-end py-4 px-6">
						<Button
							variant="primary"
							size="medium"
							onClick={redeem}
							loading={{ state: redeeming, text: <>Redeeming...</> }}
						>
							Redeem gift
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		interface Gift {
			_id: string;
			code: string;
			from: string;
			to: string;
			redeemed: boolean;
			purchasedAt: number;
			product: GiftProduct;
		}

		interface GiftProduct {
			id: string;
			price: string;
		}

		const user = await ctx.req.session.get("user");

		if (!user) {
			return {
				redirect: {
					destination: `/api/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`,
					permanent: false,
				},
			};
		}

		const goHome = () => {
			return {
				redirect: {
					destination: `/`,
					permanent: false,
				},
			};
		};

		const code = ctx.query.code;
		if (!code) {
		}

		const db = await dbConnect();
		const gift = (await db.collection("gifts").findOne({ code, to: user.id })) as Gift;

		if (!gift || gift.to !== user.id || gift.redeemed) {
			return goHome();
		}

		const stripe = stripeConnect();
		const product = await stripe.products.retrieve(gift.product.id);
		const price = (
			await stripe.prices.search({
				query: `metadata['giftProduct']:'${gift.product.id}'`,
			})
		).data[0];
		const dbUser = (await db.collection("users").findOne({ _id: gift.from })) as UserData;

		return {
			props: {
				gift: {
					from: `${dbUser.name}#${dbUser.discriminator}`,
					code: gift.code,
					product: {
						name: product.name,
						image: product.images[0],
						price: {
							interval: price.recurring!.interval,
							interval_count: price.recurring!.interval_count,
						},
					},
				},
				user,
			},
		};
	}
);
