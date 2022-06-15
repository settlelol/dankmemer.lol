import axios from "axios";
import clsx from "clsx";
import { format } from "date-fns";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "src/components/Badge";
import Container from "src/components/control/Container";
import CancelSubscription from "src/components/dashboard/account/modals/Cancel";
import DashboardLinks from "src/components/dashboard/DashboardLinks";
import Dialog from "src/components/Dialog";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { SubscriptionInformation } from "src/pages/api/customers/[userId]/subscription";
import { PageProps, Profile } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function Account({ user }: PageProps) {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState<Profile>();
	const [subscribedTo, setSubscribedTo] = useState<SubscriptionInformation>();
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		axios
			.all([
				axios.get(`/api/community/profile/get/${user!.id}`),
				axios.get(`/api/customers/${user!.id}?sensitive=true`),
			])
			.then(
				axios.spread(({ data: profile }, { data: customerData }) => {
					setProfile(profile);
					if (customerData.activeSubscription) {
						axios(`/api/customers/${user!.id}/subscription`)
							.then(({ data: { subscription } }) => {
								setSubscribedTo(subscription);
							})
							.catch((e) => {
								console.error(e);
							});
					}
				})
			)
			.catch(() => {
				toast.error("Failed to load user data. Please try again later.");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return (
		<Container customSpacing={true} title="Account" links={<DashboardLinks user={user!} />}>
			{loading || !profile ? (
				<LoadingPepe />
			) : (
				<main>
					<Dialog open={dialogOpen} onClose={setDialogOpen} closeButton>
						<CancelSubscription userId={user!.id} />
					</Dialog>
					<div
						className="relative h-64 w-full bg-cover bg-center bg-no-repeat dark:bg-dank-500"
						style={{ backgroundImage: `url('${profile.user.banner}')` }}
					>
						<div
							className="absolute -bottom-20 left-8 h-44 w-44 rounded-full border-8 border-white bg-neutral-200 bg-cover bg-center bg-no-repeat dark:border-dark-400 dark:bg-dark-200"
							style={{
								backgroundImage: `url('${profile.user.avatar}?size=512')`,
							}}
						></div>
					</div>
					<div className="ml-56 mt-2">
						<div className="flex items-baseline justify-start">
							<Title size="big">{profile.user.name}</Title>
							<Title size="xsmall" className="font-semibold text-neutral-500 dark:!text-neutral-400">
								#{profile.user.discriminator}
							</Title>
						</div>
						<div>
							{profile.user.developer && <Badge role="developer" />}
							{profile.user.moderator && <Badge role="moderator" />}
							{profile.user.botModerator && <Badge role="botModerator" />}
							{profile.user.modManager && <Badge role="modManager" />}
							{profile.user.honorable && <Badge role="honorable" />}
						</div>
					</div>
					{subscribedTo && (
						<section className="my-10 mx-10 max-w-lg">
							<Title size="big" className="font-semibold">
								Your Subscription
							</Title>
							<p className="text-neutral-500 dark:text-neutral-400">Manage your active subscription</p>
							<div className="mt-5 flex w-full flex-col">
								<div className="flex items-center justify-start space-x-4">
									<div
										className="h-14 w-14 rounded-md bg-[length:40px_40px] bg-center bg-no-repeat dark:bg-dank-500"
										style={{
											backgroundImage: `url('${subscribedTo.product.image}')`,
										}}
									></div>
									<div>
										<p className="text-black dark:text-white">{subscribedTo.product.name}</p>
										<p className="-mt-1 text-sm text-neutral-700 dark:text-neutral-300">
											${(subscribedTo.product.price.value / 100).toFixed(2)}{" "}
											{subscribedTo.product.price.interval.count === 1 ? (
												<>every {subscribedTo.product.price.interval.period}</>
											) : (
												<>
													every {subscribedTo.product.price.interval?.count}{" "}
													{subscribedTo.product.price.interval.period}s
												</>
											)}
										</p>
									</div>
								</div>
							</div>
							{!subscribedTo.finalPeriod && (
								<div className="mt-2 flex items-center justify-start space-x-3">
									<Button size="medium" className="w-2/3" disabled={subscribedTo.finalPeriod}>
										Change tier
									</Button>
									<Button size="medium" className="w-full" disabled={subscribedTo.finalPeriod}>
										Change billing period
									</Button>
									<Button
										size="medium"
										variant="danger"
										className="w-11/12 grow"
										onClick={() => setDialogOpen(true)}
										disabled={subscribedTo.finalPeriod}
										title="You have already requested your subscription be cancelled."
									>
										Cancel subscription
									</Button>
								</div>
							)}
							<p
								className={clsx(
									"mt-2 text-xs text-neutral-500 dark:text-neutral-400",
									subscribedTo.finalPeriod && "text-red-400 dark:text-red-400"
								)}
							>
								{subscribedTo.finalPeriod ? (
									<>Your subscription will end on: </>
								) : (
									<>
										Please be aware that these actions will come into affect at the end of your
										current billing period on:{" "}
									</>
								)}
								<span className="underline">
									{format(new Date(subscribedTo.currentPeriod.end * 1000), "LLLL do', at' h:mm aaa")}
								</span>
							</p>
						</section>
					)}
				</main>
			)}
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
