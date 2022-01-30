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
			<div className="mx-8 xl:mx-0">
				<div className="flex flex-col my-20">
					<div className="flex flex-col space-y-4">
						<GoBack />
					</div>
					<div className="font-bold font-montserrat text-3xl text-dank-300 dark:text-light-100">
						Manage the Store
					</div>
					<div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 space-x-0 lg:space-x-4">
						<div className=""></div>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
