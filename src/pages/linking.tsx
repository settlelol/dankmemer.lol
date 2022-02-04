import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Container from "../components/ui/Container";
import TextLink from "../components/ui/TextLink";
import { PageProps } from "../types";
import { unauthenticatedRoute } from "../util/redirects";
import { withSession } from "../util/session";

export default function LinkingPage({ user }: PageProps) {
	const router = useRouter();

	const success = router.query.success == "true";
	const message = router.query.message;

	return (
		<Container title="Linking Results" user={user}>
			<div className="relative my-32">
				<div className="mb-40 flex flex-col items-center text-center text-dark-500 dark:text-white">
					<div className="flex flex-col space-y-2 rounded-md bg-light-500 p-20 dark:bg-dark-500">
						<div className="text-2xl font-bold text-dank-300">
							{success ? "Success!" : "Uh Oh..."}
						</div>

						<div className="flex flex-col space-y-4">
							<div>{message}</div>

							{success ? (
								<TextLink href="/">Go Home</TextLink>
							) : (
								<TextLink href="/">Try Again</TextLink>
							)}
						</div>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(unauthenticatedRoute);
