import { GetServerSideProps } from "next";
import { useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import UserAccessControls from "src/components/control/users/access/Cards";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { moderatorRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function StoreOverview({ user }: PageProps) {
	const [populateWith, setPopulateWith] = useState<string>("");

	return (
		<ControlPanelContainer title="User Access" links={<ControlLinks user={user!} />}>
			<main>
				<Title size="big">User Access</Title>
				<p className="text-neutral-500 dark:text-neutral-400">
					Review or change a user's access to the website, or specific parts of the website.
				</p>
				<section className="mt-8">
					<div>
						<Input
							width="w-64"
							type="text"
							placeholder="270904126974590976"
							label="Populate all fields for this user"
							icon="bxs:id-card"
							iconSize={16}
							value={populateWith}
							onChange={(e) => {
								!e.target.value.match(/(^[0-9]+$|^$)/) || e.target.value.length >= 21
									? e.preventDefault()
									: setPopulateWith(e.target.value);
							}}
							className="pl-9"
						/>
					</div>
				</section>
				<section className="mt-8 flex items-center space-x-4">
					<UserAccessControls populateWith={populateWith} />
				</section>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(moderatorRoute);
