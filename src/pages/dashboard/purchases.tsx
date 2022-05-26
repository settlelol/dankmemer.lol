import axios from "axios";
import { GetServerSideProps } from "next";
import { useEffect } from "react";
import Container from "src/components/control/Container";
import DashboardLinks from "src/components/control/DashboardLinks";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function PurchaseHistory({ user }: PageProps) {
	useEffect(() => {
		axios(`/api/customers/history?id=${user!.id}`)
			.then(({ data }) => {
				console.log(data.purchases);
			})
			.catch(() => {
				console.error("no history");
			});
	}, []);

	return (
		<Container title="Account" links={<DashboardLinks user={user!} />}>
			<main>
				<Title size="big">Purchase history</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					View and manage all previously purchased goods from our store which are linked to your account.
				</p>
				<section className=""></section>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
