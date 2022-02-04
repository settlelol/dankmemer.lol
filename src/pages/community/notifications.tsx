import axios from "axios";
import clsx from "clsx";
import { formatDistance } from "date-fns";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import { Title } from "../../components/Title";
import Container from "../../components/ui/Container";
import { Notification, PageProps } from "../../types";
import { authenticatedRoute } from "../../util/redirects";
import { withSession } from "../../util/session";
import Link from "next/link";

export default function Notifications({ user }: PageProps) {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [lastNotification, setLastNotification] = useState(0);
	const [page, setPage] = useState(0);

	useEffect(() => {
		axios(`/api/community/notifications/get?page=${page}`).then(
			({ data }) => {
				setNotifications(data.notifications);
				if (page == 0) {
					setLastNotification(data.lastNotification);
				}
			}
		);
	}, []);
	return (
		<Container title="Notifications" user={user}>
			<div className="my-16 mx-8 flex flex-col space-y-4 xl:mx-0">
				<Title size="big">Your Notifications</Title>
				<div className="flex flex-col space-y-4">
					{notifications.map((notification, i) => (
						<>
							<Link href={notification.link}>
								<a className="rounded-md bg-light-500 p-4 dark:bg-dark-100">
									<div className="flex items-center space-x-4">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-light-400 text-black dark:bg-dank-400 dark:text-white">
											<div
												className="material-icons"
												style={{ fontSize: "20px" }}
											>
												{notification.icon}
											</div>
										</div>
										<div className="flex-1 text-sm">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<div className="break-all text-black dark:text-white">
														{notification.title}
													</div>
													{notification.createdAt >
														lastNotification && (
														<div className="rounded-md bg-rose-500 px-1 text-xs">
															NEW
														</div>
													)}
												</div>
												<div className="text-light-600">
													{formatDistance(
														new Date(
															notification.createdAt
														),
														new Date(),
														{
															addSuffix: true,
														}
													)}
												</div>
											</div>
											<div className="text-light-600">
												{notification.content}
											</div>
										</div>
									</div>
								</a>
							</Link>
						</>
					))}
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(authenticatedRoute);
