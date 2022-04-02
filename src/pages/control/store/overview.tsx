import { GetServerSideProps } from "next";
import ControlPanelContainer from "src/components/control/Container";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function StoreOverview({ user }: PageProps) {
	return (
		<ControlPanelContainer user={user} title="Store Overview">
			<div className="my-10">
				<Title size="big">Store Overview</Title>
				<div className="h-14 w-full dark:bg-dank-500"></div>
			</div>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
