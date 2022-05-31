import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";
import { Icon as Iconify } from "@iconify/react";
import { useTheme } from "next-themes";
import { User } from "src/types";

interface Props {
	user: User;
}

export default function DashboardLinks({ user }: Props) {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<LinkGroup title="Account">
				{/* <Navlink
					icon="ant-design:user-outlined"
					text="Account overview"
					href="/dashboard/account"
				/> */}
				<Navlink icon="la:file-invoice-dollar" text="Purchase history" href="/dashboard/purchases" />
				{/* <Navlink
					icon="fa6-regular:face-angry"
					text="Infraction history"
					href="/dashboard/infractions"
				/> */}
			</LinkGroup>
			<div className="absolute bottom-0 left-0 mb-2 h-16 w-full px-9">
				<div className="box-border flex h-14 w-full items-center justify-between rounded-md bg-[#D8DCDE] dark:bg-dank-500">
					<div className="flex items-center justify-start pl-4">
						<img src={user.avatar} width={32} className="rounded-full" />
						<div className="ml-2">
							<p className="leading-none text-gray-800 dark:text-white">{user.username}</p>
							<p className="text-xs leading-none text-light-600">
								#{user.discriminator}
								{/* Maybe we can change this to show a subscription tier if the user has one */}
							</p>
						</div>
					</div>
					<div className="flex items-center justify-end pr-4">
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
