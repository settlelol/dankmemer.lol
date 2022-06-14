import { GetServerSideProps } from "next";
import Container from "src/components/control/Container";
import DashboardLinks from "src/components/dashboard/DashboardLinks";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function Account({ user }: PageProps) {
	return (
		<Container customSpacing={true} title="Account" links={<DashboardLinks user={user!} />}>
			<main>
				<div className="h-64 w-full dark:bg-dank-500"></div>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
