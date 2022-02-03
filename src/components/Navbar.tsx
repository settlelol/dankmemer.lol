import axios from "axios";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "../types";
import { Avatar } from "./Avatar";
import Button from "./ui/Button";
import Dropdown from "./ui/Dropdown";

interface Props {
	user?: User;
}

export default function Navbar({ user }: Props) {
	const [hamburger, setHamburger] = useState(false);
	const [discount, setDiscount] = useState(0);
	const [mobileAccountExpanded, setMobileAccountExpanded] = useState(false);
	const [notifications, setNotifications] = useState(0);

	useEffect(() => {
		document.documentElement.style.overflow = hamburger ? "hidden" : "auto";
	}, [hamburger]);

	useEffect(() => {
		const handleResize = () => {
			setHamburger(false);
		};

		axios(`/api/discount/get`).then(({ data }) => {
			setDiscount((data.percent || 0) * 100);
		});

		axios(`/api/community/notifications/count`).then(({ data }) => {
			setNotifications(data.count);
		});

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<>
			<div className="flex items-center justify-center text-lg">
				<nav className="z-[1] mt-0 flex w-full max-w-7xl justify-between bg-light-200 p-4 drop-shadow-xl dark:bg-dark-200 dark:drop-shadow-none lg:mt-5 lg:w-11/12 lg:rounded-md">
					<div className="flex items-center">
						<Link href="/">
							<img
								className="cursor-pointer"
								src={"/img/memer.png"}
								alt="Logo"
								width="42"
							/>
						</Link>
						<ul className="ml-5 hidden space-x-4 lg:flex">
							<li className="inline-block text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100">
								<Link href="/commands">Commands</Link>
							</li>
							<li className="inline-block text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100">
								<Link href="/faq">FAQ</Link>
							</li>
							<li
								className={clsx(
									"inline-block  ",
									discount
										? "text-yellow-300 hover:text-yellow-400 dark:text-yellow-300 dark:hover:text-yellow-400"
										: "text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100"
								)}
							>
								<Link href="/loot">
									<div className="flex cursor-pointer items-center space-x-2">
										<span>Store</span>
										{!!discount && (
											<span className="rounded-md bg-yellow-300 px-2 font-montserrat text-xs font-bold text-dark-500">
												SALE: {discount}%
											</span>
										)}
									</div>
								</Link>
							</li>
							<li className="inline-block text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100">
								<Link href="/items">Items</Link>
							</li>
							<li className="inline-block text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100">
								<Link href="/community">Community</Link>
							</li>
						</ul>
						<div className="ml-4 inline-block font-montserrat text-xl font-bold text-gray-800 dark:text-light-200 lg:hidden">
							Dank Memer
						</div>
					</div>

					<div className="relative hidden items-center lg:flex">
						<Link href="https://discord.gg/meme">
							<a
								className="inline-block text-gray-800 hover:text-dank-300 dark:text-light-200 dark:hover:text-dank-100"
								rel="noreferrer noopener"
							>
								Support
							</a>
						</Link>
						{!user && (
							<Link href="/api/auth/login">
								<a
									className="inline-block pl-4 text-dank-300"
									rel="noreferrer noopener"
								>
									Login
								</a>
							</Link>
						)}
						{user && (
							<div className="relative flex h-full items-center pl-4">
								{notifications > 0 && (
									<div className="absolute -right-1 -top-1 z-50 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs">
										{Math.min(notifications, 9)}
										{notifications > 9 ? "+" : ""}
									</div>
								)}
								<Dropdown
									content={
										<div className="flex items-center space-x-2 p-2">
											<Avatar
												id={user.id}
												link={user.avatar}
												size="32px"
											/>
											<div className="text-dark-500 dark:text-white">
												{user.username}
											</div>
											<span className="material-icons text-dark-100 dark:text-white">
												expand_more
											</span>
										</div>
									}
									options={[
										user.moderator
											? {
													label: "Control Panel",
													link: "/control",
											  }
											: null,
										{
											label: "Profile",
											link: `/@${user.id}`,
										},
										{
											label: (
												<div className="flex items-center space-x-2">
													<div>Notifications</div>
													{notifications > 0 && (
														<div className="z-50 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs">
															{Math.min(
																notifications,
																9
															)}
															{notifications > 9
																? "+"
																: ""}
														</div>
													)}
												</div>
											),
											link: `/community/notifications`,
										},
										{
											label: "Appeal a ban",
											link: "/appeals",
										},
										{
											label: "Report a user",
											link: "/reports",
										},
										{
											label: "Logout",
											link: "/api/auth/logout",
											variant: "danger",
										},
									]}
								/>
							</div>
						)}
					</div>
					<div
						className="relative flex cursor-pointer select-none items-center text-dank-500 dark:text-light-100 lg:hidden"
						onClick={() => setHamburger(!hamburger)}
					>
						<span className="material-icons">menu</span>
					</div>
				</nav>
				{hamburger && (
					<ul className="absolute top-[74px] z-[9999999] box-border flex h-screen w-screen flex-col bg-light-200 px-6 dark:bg-dark-200">
						<Link href="/commands">
							<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
								Commands
							</li>
						</Link>
						<Link href="/faq">
							<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
								Frequently asked questions
							</li>
						</Link>
						<Link href="/community">
							<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
								Community
							</li>
						</Link>
						<Link href="/loot">
							<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
								Store
							</li>
						</Link>
						<Link href="/items">
							<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
								Items
							</li>
						</Link>
						{user ? (
							<div className="mt-5 border-t-[1px] border-dank-600 pt-5">
								<div
									className="flex w-full select-none items-center justify-between"
									onClick={() =>
										setMobileAccountExpanded(
											!mobileAccountExpanded
										)
									}
								>
									<div className="flex items-center">
										<Avatar
											id={user.id}
											link={user.avatar}
											size="64px"
											className="mr-4"
										/>
										<div>
											<h3 className="font-montserrat font-bold leading-none">
												{user.username}
											</h3>
											<p className="text-sm font-medium italic leading-none text-light-600">
												#{user.discriminator}
											</p>
										</div>
									</div>
									<span
										className="material-icons transition-transform ease-in-out"
										style={{
											transform: `rotate(${
												mobileAccountExpanded ? 180 : 0
											}deg)`,
										}}
									>
										expand_more
									</span>
								</div>
								<div
									id="account-links"
									className="ease mb-5 overflow-hidden pl-3 transition-all"
									style={{
										height: mobileAccountExpanded
											? user.moderator
												? "144px"
												: "96px"
											: "0px",
									}}
								>
									<Link href="/appeals">
										<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
											Appeal a ban
										</li>
									</Link>
									<Link href="/reports">
										<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
											Report a user
										</li>
									</Link>
									{user?.moderator && (
										<Link href="/control">
											<li className="pt-5 text-dark-500 hover:text-light-600 dark:text-white">
												Control panel
											</li>
										</Link>
									)}
								</div>
								<Button
									variant="danger"
									size="medium"
									block
									href="/api/auth/logout"
								>
									Logout
								</Button>
							</div>
						) : (
							<div className="mt-5 border-t-[1px] border-dank-600 pt-5">
								<Button
									variant="primary"
									size="medium"
									block
									href="/api/auth/login"
								>
									Login
								</Button>
							</div>
						)}
					</ul>
				)}
			</div>
		</>
	);
}
