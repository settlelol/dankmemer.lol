import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "next-themes";
import { User } from "src/types";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { useEffect } from "react";

interface Props {
	user: User;
	full?: boolean;
}

export default function ControlLinks({ user }: Props) {
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		const hScroll = document.querySelectorAll("div.simplebar-track:nth-child(2)")[0];
		const vScroll = document.querySelectorAll("div.simplebar-track:nth-child(3)")[0];
		hScroll.setAttribute("style", "display: none;");
		vScroll.setAttribute("data-simplebar-v-scroll-offset", "");
		vScroll.setAttribute("style", "--v-scroll-offset: -15px;");
	}, []);

	return (
		<>
			<SimpleBar className="max-h-[670px] w-full xl:short:max-h-[650px] xl:tall:max-h-[750px]">
				<LinkGroup title="Website">
					<Navlink icon="bx:bxs-dashboard" text="Website overview" href="/control/website/overview" />
					<Navlink
						icon="fluent:megaphone-loud-24-regular"
						text="Announcements"
						href="/control/website/announcements"
					/>
				</LinkGroup>
				<LinkGroup title="Users">
					<Navlink icon="tabler:hammer" text="Bans and Blacklists" href="/control/users/bans-bl" />
					<Navlink icon="tabler:message-report" text="Reports" href="/control/users/reports" />
				</LinkGroup>
				<LinkGroup title="Store">
					<Navlink icon="bx:bx-store" text="Store overview" href="/control/store/overview" />
					<Navlink icon="akar-icons:shipping-box-01" text="Products" href="/control/store/products" />
					<Navlink icon="gg:math-percent" size={30} text="Discounts" href="/control/store/discounts" />
					<Navlink
						icon="fluent:clipboard-bullet-list-rtl-16-regular"
						text="Recent purchases"
						href="/control/store/purchases"
					/>
					<Navlink icon="bx:bx-error" text="Refund requests" href="/control/store/refunds" />
					<Navlink
						icon="fluent:rectangle-landscape-20-filled"
						text="Featured banners"
						href="/control/store/banners"
					/>
				</LinkGroup>
				<LinkGroup title="Miscellaneous" nomb>
					<Navlink icon="ph:users-three" text="All staff" href="/control/staff" />
					<Navlink icon="bx:bxs-file-json" text="Website data" href="/control/data-upload" />
				</LinkGroup>
			</SimpleBar>
			<div className="absolute bottom-5 left-0 ml-6 flex justify-center xl:hidden">
				<img src={user.avatar} width={32} className="rounded-full" />
			</div>
			<div className="absolute bottom-0 left-0 mb-2 hidden h-16 w-full px-9 xl:block">
				<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-[#D8DCDE] dark:bg-dank-500">
					<div className="flex items-center justify-start pl-4">
						<img src={user.avatar} width={32} className="rounded-full" />
						<div className="ml-2">
							<p className="leading-none text-gray-800 dark:text-white">{user.username}</p>
							<p className="text-xs leading-none text-light-600">#{user.discriminator}</p>
						</div>
					</div>
					<div className="hidden items-center justify-end pr-4 xl:flex">
						<Iconify
							icon={theme === "light" ? "fluent:weather-moon-24-filled" : "akar-icons:sun-fill"}
							height="20"
							className="cursor-pointer text-gray-500 transition-all hover:!text-black dark:text-light-600 dark:hover:!text-white"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
