import { ReactNode } from "react";
import { User } from "src/types";
import LinkGroup from "./LinkGroup";
import Navlink from "./Navlink";

interface Props {
	children: ReactNode;
	title?: string;
	user?: User;
}

export default function ControlPanelContainer({
	children,
	title,
	user,
}: Props) {
	return (
		<>
			<div className="fixed top-0 left-0 dark:bg-dark-300 h-full w-72 px-9 py-7">
				<div className="flex justify-start items-center mb-7">
					<img src={"/img/memer.png"} width={41} height={41} />
					<h1 className="font-montserrat font-bold text-2xl ml-3">
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
			</div>
			<div className="flex justify-center ml-10">
				<div className="max-w-7xl relative w-full">{children}</div>
			</div>
		</>
	);
}
