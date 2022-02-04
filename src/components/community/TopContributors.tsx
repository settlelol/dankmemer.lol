import axios from "axios";
import { useEffect, useState } from "react";
import { Contributor } from "../../types";
import { Avatar } from "../Avatar";
import Link from "next/link";

export function TopContributors() {
	const [contributors, setContributors] = useState<Contributor[]>([]);

	useEffect(() => {
		axios("/api/community/contributors/top").then(({ data }) => {
			setContributors(data);
		});
	}, []);

	return (
		<div className="grid justify-items-start gap-4 rounded-md bg-light-500 p-4 dark:bg-dark-100 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:justify-items-center">
			{contributors.map((contributor, i) => (
				<Link href={`/@${contributor.vanity || contributor.id}`}>
					<a className="flex cursor-pointer items-center space-x-2">
						<Avatar
							size="48px"
							id={contributor.id}
							link={contributor.avatar}
						/>
						<div className="flex flex-col -space-y-1">
							<div className="flex items-end">
								<div className="sm:text-md text-sm font-bold text-black dark:text-white">
									{contributor.name.replace(
										/[^\x00-\x7F]/g,
										""
									)}
								</div>
								<div className="text-sm italic text-light-600">
									#{contributor.discriminator}
								</div>
							</div>
							<div className="text-sm text-light-600">
								#{i + 1}
							</div>
						</div>
					</a>
				</Link>
			))}
		</div>
	);
}
