import { ReactNode } from "react";
import { User } from "src/types";
import { Icon as Iconify } from "@iconify/react";
import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
	children: ReactNode;
	title: string;
	user: User | undefined;
}

export default function ControlPanelContainer({
	children,
	title,
	user,
}: Props) {
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	return (
		<>
			<ToastContainer position="top-center" theme="colored" />
			<div className="fixed top-0 left-0 bg-[#ECEFF0] dark:bg-dark-100 h-full w-72 px-9 py-5">
				<div
					className="flex justify-start items-center mb-5 cursor-pointer"
					onClick={() => router.push("/")}
				>
					<img src={"/img/memer.png"} width={41} height={41} />
					<h1 className="font-montserrat font-bold text-2xl ml-3 select-none text-dank-200 dark:text-white">
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
				<div className="absolute bottom-0 left-0 w-full h-16 px-9 mb-2">
					<div className="flex justify-between items-center bg-[#D8DCDE] dark:bg-dank-500 w-full box-border h-14 rounded-md">
						<div className="flex justify-start items-center pl-4">
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
						<div className="flex justify-end items-center pr-4">
							<Iconify
								icon={
									theme === "light"
										? "fluent:weather-moon-24-filled"
										: "akar-icons:sun-fill"
								}
								height="20"
								className="transition-all text-gray-500 dark:text-light-600 hover:!text-black dark:hover:!text-white cursor-pointer"
								onClick={() =>
									setTheme(
										theme === "dark" ? "light" : "dark"
									)
								}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-start ml-80">
				<div className="relative w-full">{children}</div>
			</div>
		</>
	);
}
