import { GetServerSideProps } from "next";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function StoreOverview({ user }: PageProps) {
	return (
		<ControlPanelContainer
			title="Store Overview"
			links={<ControlLinks user={user!} />}
		>
			<main>
				<Title size="big">Store Overview</Title>
				<div className="h-14 w-full dark:bg-dank-500"></div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
