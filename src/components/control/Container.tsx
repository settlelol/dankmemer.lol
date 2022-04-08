import { ReactNode } from "react";
import { User } from "src/types";
import { Icon as Iconify } from "@iconify/react";
import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import clsx from "clsx";

interface Props {
	children: ReactNode;
	title: string;
	user: User | undefined;
	hideRightPane?: any;
	rightPaneVisible?: boolean;
	rightPaneContent?: ReactNode;
}

export default function ControlPanelContainer({
	children,
	title,
	user,
	hideRightPane,
	rightPaneVisible,
	rightPaneContent,
}: Props) {
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	return (
		<>
			<Head>
				<title>
					Dank Memer {title.length >= 1 ? `| ${title}` : ""}
				</title>
			</Head>
			<ToastContainer position="top-center" theme="colored" />
			{rightPaneVisible ? (
				<div className="select-none opacity-50" onClick={hideRightPane}>
					<div className="pointer-events-none fixed top-0 left-0 h-full w-72 bg-neutral-100 px-9 py-5 dark:bg-dark-100">
						<div
							className="mb-5 flex cursor-pointer items-center justify-start"
							onClick={() => router.push("/")}
						>
							<img
								src={"/img/memer.png"}
								width={41}
								height={41}
							/>
							<h1 className="ml-3 select-none font-montserrat text-2xl font-bold text-dank-200 dark:text-white">
								Dank Memer
							</h1>
						</div>
						<LinkGroup title="Website">
							<Navlink
								icon="bx:bxs-dashboard"
								text="Website overview"
								href="/control/website/overview"
							/>
							<Navlink
								icon="fluent:megaphone-loud-24-regular"
								text="Announcements"
								href="/control/website/announcements"
							/>
						</LinkGroup>
						<LinkGroup title="Users">
							<Navlink
								icon="tabler:hammer"
								text="Bans and Blacklists"
								href="/control/users/bans-bl"
							/>
							<Navlink
								icon="tabler:message-report"
								text="Reports"
								href="/control/users/reports"
							/>
						</LinkGroup>
						<LinkGroup title="Store">
							<Navlink
								icon="bx:bx-store"
								text="Store overview"
								href="/control/store/overview"
							/>
							<Navlink
								icon="akar-icons:shipping-box-01"
								text="Products"
								href="/control/store/products/manage"
							/>
							<Navlink
								icon="gg:math-percent"
								size={30}
								text="Discounts"
								href="/control/store/discounts"
							/>
							<Navlink
								icon="fluent:clipboard-bullet-list-rtl-16-regular"
								text="Recent purchases"
								href="/control/store/purchases"
							/>
							<Navlink
								icon="bx:bx-error"
								text="Disputed purchases"
								href="/control/store/purchases/disputes"
							/>
						</LinkGroup>
						<LinkGroup title="Miscellaneous">
							<Navlink
								icon="ph:users-three"
								text="All staff"
								href="/control/staff"
							/>
							<Navlink
								icon="bx:bxs-file-json"
								text="Website data"
								href="/control/data-upload"
							/>
						</LinkGroup>
						<div className="absolute bottom-0 left-0 mb-2 h-16 w-full px-9">
							<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-[#D8DCDE] dark:bg-dank-500">
								<div className="flex items-center justify-start pl-4">
									<img
										src={user?.avatar}
										width={32}
										className="rounded-full"
									/>
									<div className="ml-2">
										<p className="leading-none text-gray-800 dark:text-white">
											{user?.username}
										</p>
										<p className="text-xs leading-none text-light-600">
											#{user?.discriminator}
										</p>
									</div>
								</div>
								<div className="flex items-center justify-end pr-4">
									<Iconify
										icon={
											theme === "light"
												? "fluent:weather-moon-24-filled"
												: "akar-icons:sun-fill"
										}
										height="20"
										className="cursor-pointer text-gray-500 transition-all hover:!text-black dark:text-light-600 dark:hover:!text-white"
										onClick={() =>
											setTheme(
												theme === "dark"
													? "light"
													: "dark"
											)
										}
									/>
								</div>
							</div>
						</div>
					</div>
					<div
						className={clsx(
							"pointer-events-none ml-80 flex justify-start"
						)}
					>
						<div className="relative w-full">{children}</div>
					</div>
				</div>
			) : (
				<>
					<div className="fixed top-0 left-0 h-full w-72 bg-neutral-100 px-9 py-5 dark:bg-dark-100">
						<div
							className="mb-5 flex cursor-pointer items-center justify-start"
							onClick={() => router.push("/")}
						>
							<img
								src={"/img/memer.png"}
								width={41}
								height={41}
							/>
							<h1 className="ml-3 select-none font-montserrat text-2xl font-bold text-dank-200 dark:text-white">
								Dank Memer
							</h1>
						</div>
						<LinkGroup title="Website">
							<Navlink
								icon="bx:bxs-dashboard"
								text="Website overview"
								href="/control/website/overview"
							/>
							<Navlink
								icon="fluent:megaphone-loud-24-regular"
								text="Announcements"
								href="/control/website/announcements"
							/>
						</LinkGroup>
						<LinkGroup title="Users">
							<Navlink
								icon="tabler:hammer"
								text="Bans and Blacklists"
								href="/control/users/bans-bl"
							/>
							<Navlink
								icon="tabler:message-report"
								text="Reports"
								href="/control/users/reports"
							/>
						</LinkGroup>
						<LinkGroup title="Store">
							<Navlink
								icon="bx:bx-store"
								text="Store overview"
								href="/control/store/overview"
							/>
							<Navlink
								icon="akar-icons:shipping-box-01"
								text="Products"
								href="/control/store/products/manage"
							/>
							<Navlink
								icon="gg:math-percent"
								size={30}
								text="Discounts"
								href="/control/store/discounts"
							/>
							<Navlink
								icon="fluent:clipboard-bullet-list-rtl-16-regular"
								text="Recent purchases"
								href="/control/store/purchases"
							/>
							<Navlink
								icon="bx:bx-error"
								text="Disputed purchases"
								href="/control/store/purchases/disputes"
							/>
						</LinkGroup>
						<LinkGroup title="Miscellaneous">
							<Navlink
								icon="ph:users-three"
								text="All staff"
								href="/control/staff"
							/>
							<Navlink
								icon="bx:bxs-file-json"
								text="Website data"
								href="/control/data-upload"
							/>
						</LinkGroup>
						<div className="absolute bottom-0 left-0 mb-2 h-16 w-full px-9">
							<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-[#D8DCDE] dark:bg-dank-500">
								<div className="flex items-center justify-start pl-4">
									<img
										src={user?.avatar}
										width={32}
										className="rounded-full"
									/>
									<div className="ml-2">
										<p className="leading-none text-gray-800 dark:text-white">
											{user?.username}
										</p>
										<p className="text-xs leading-none text-light-600">
											#{user?.discriminator}
										</p>
									</div>
								</div>
								<div className="flex items-center justify-end pr-4">
									<Iconify
										icon={
											theme === "light"
												? "fluent:weather-moon-24-filled"
												: "akar-icons:sun-fill"
										}
										height="20"
										className="cursor-pointer text-gray-500 transition-all hover:!text-black dark:text-light-600 dark:hover:!text-white"
										onClick={() =>
											setTheme(
												theme === "dark"
													? "light"
													: "dark"
											)
										}
									/>
								</div>
							</div>
						</div>
					</div>
					<div
						className={clsx(
							"ml-80 flex justify-start",
							rightPaneVisible && "pointer-events-none"
						)}
					>
						<div className="relative w-full">{children}</div>
					</div>
				</>
			)}
			<div
				className={clsx(
					"fixed top-0 right-0 h-full w-1/5 min-w-[330px] max-w-5xl resize-x overflow-auto bg-neutral-100 px-8 pt-10 transition-transform duration-300 dark:bg-dark-100",
					rightPaneVisible ? "translate-x-0" : "translate-x-full"
				)}
			>
				{rightPaneVisible ? rightPaneContent : ""}
			</div>
		</>
	);
}
