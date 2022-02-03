import { GetServerSideProps } from "next";
import { toast } from "react-toastify";
import { ControlCard } from "../../components/ControlCard";
import Container from "../../components/control/Container";
import GoBack from "../../components/ui/GoBack";
import { PageProps } from "../../types";
import { developerRoute } from "../../util/redirects";
import { withSession } from "../../util/session";

export default function ControlStorePage({ user }: PageProps) {
	return (
		<Container title="Control" user={user}>
			<div className="mx-8">
				<div className="my-10 flex flex-col">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Manage the Store
					</div>
					<div className="flex flex-col space-y-4 space-x-0 lg:flex-row lg:space-y-0 lg:space-x-4">
						<div className=""></div>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
