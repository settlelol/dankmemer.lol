import { GetServerSideProps } from "next";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { moderatorRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function WebsiteOverview({ user }: PageProps) {
	return (
		<ControlPanelContainer title="Website Overview" links={<ControlLinks user={user!} />}>
			<main>
				<Title size="big">
					Good{" "}
					{new Date().getHours() <= 11
						? "morning"
						: new Date().getHours() > 11 && new Date().getHours() <= 16
						? "afternoon"
						: "evening"}
					, {user?.username}
				</Title>
				<div className="h-14 w-full text-red-400 dark:bg-dank-500">{"<<<<<"} this is not done</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(moderatorRoute);
