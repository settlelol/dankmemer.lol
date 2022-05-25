import clsx from "clsx";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Container from "../../components/ui/Container";
import { PageProps } from "../../types";
import { moderatorRoute } from "../../util/redirects";
import { withSession } from "../../util/session";

interface PanelProps {
	link: string;
	label: string;
}

function Panel({ link, label }: PanelProps) {
	return (
		<Link href={link} passHref>
			<a
				className={clsx(
					"flex flex-col items-center justify-center",
					"cursor-pointer select-none rounded-md py-8",
					"bg-light-500 dark:bg-dark-100",
					"border border-light-500 hover:border-dank-300 dark:border-dark-100 dark:hover:border-dank-300"
				)}
			>
				<div className="font-montserrat text-xl font-bold text-dank-500 dark:text-white">
					{label}
				</div>
			</a>
		</Link>
	);
}

export default function ControlPage({ user }: PageProps) {
	return (
		<Container title="Control" user={user}>
			<div className="my-16 mx-8 flex flex-col space-y-8 xl:mx-0">
				<div className="flex items-center justify-between">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Control Panel
					</div>
				</div>
				{user?.developer && (
					<div className="flex flex-col">
						<div className="font-montserrat text-xl font-bold text-dank-300 dark:text-light-100">
							Administration
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
							<Panel link="/control/users" label="User Control" />
							<Panel link="/control/website" label="Website" />
							<Panel link="/control/jobs" label="Jobs" />
							<Panel
								link="/control/store/overview"
								label="Store"
							/>
						</div>
					</div>
				)}
				<div className="flex flex-col">
					<div className="font-montserrat text-xl font-bold text-dank-300 dark:text-light-100">
						Moderation
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
						<Panel link="/control/inspect" label="Inspect a User" />
						<Panel
							link="/control/analytics"
							label="Support Analytics"
						/>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(moderatorRoute);
