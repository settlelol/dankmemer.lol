import axios from "axios";
import clsx from "clsx";
import MarkdownIt from "markdown-it";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-iron-session";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Container from "src/components/ui/Container";
import GoBack from "src/components/ui/GoBack";
import { PageProps } from "src/types";
import { tailwindHtml } from "src/util/blog";
import { dbConnect } from "src/util/mongodb";
import { withSession } from "src/util/session";

interface Job {
	_id: string;
	title: string;
	description: string;
	body: string;
	team: string;
	location: string;
	createdAt: number;
	active: boolean;
	applicants?: string[];
	alreadyApplied?: boolean;
}

interface Props extends PageProps {
	job: Job;
}

export default function JobPage({ user, job }: Props) {
	const router = useRouter();
	const mdParser = new MarkdownIt();

	const toggleJob = () => {
		axios({
			method: "POST",
			url: `/api/jobs/update?id=${job._id}`,
			data: { active: !job.active },
		})
			.then(() => router.reload())
			.catch((e) => {
				console.error(e);
				toast.error("Something went wrong while toggling the job status.", {
					theme: "colored",
					position: "top-center",
				});
			});
	};

	return (
		<Container title={`Job | ${job?.title}`} user={user}>
			<div className="my-10">
				<GoBack />
				{job.alreadyApplied && (
					<div className="my-3 grid min-h-[3.5rem] w-full place-items-center rounded-md bg-red-500 shadow-[0px_0px_12px] shadow-red-500">
						<p className="w-11/12 text-center md:w-8/12">
							You have already applied for this position, any applications made are final and cannot be
							changed. You are not able to submit another application at this time.
						</p>
					</div>
				)}
				<div className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
					<Title size="big">{job?.title}</Title>
					{user?.developer && (
						<div className="flex flex-row space-x-2">
							<Button size="medium" variant="dark" onClick={toggleJob}>
								{job.active ? "Disable" : "Enable"} listing
							</Button>
							<Button size="medium" variant="dark" href={`/control/website/jobs?edit=${job._id}`}>
								Edit listing
							</Button>
						</div>
					)}
				</div>
				<div className="relative mt-5 flex flex-col items-start justify-start md:flex-row">
					<div className="top-4 h-full w-full flex-1 md:sticky md:w-max ">
						<div className="mb-3 flex min-h-[14rem] w-full flex-col justify-between rounded-md bg-light-500 py-4 px-5 dark:bg-dark-100 md:w-60">
							<div>
								<div>
									<h4 className="font-inter font-bold leading-none text-neutral-800 dark:text-neutral-400">
										Team
									</h4>
									<p className="text-neutral-600 dark:text-neutral-50">{job.team}</p>
								</div>
								<div className="mt-5">
									<h4 className="font-inter font-bold leading-none text-neutral-800 dark:text-neutral-400">
										Location
									</h4>
									<p className="text-neutral-600 dark:text-neutral-50">{job.location}</p>
								</div>
								{user && user.developer && (
									<div className="my-5">
										<h4 className="font-inter font-bold leading-none text-neutral-800 dark:text-neutral-400">
											Status
										</h4>
										<p className={clsx(job.active ? "text-dank-300" : "text-red-400")}>
											{job.active ? "Active" : "Inactive"}
										</p>
									</div>
								)}
							</div>
							<Button size="medium" onClick={() => router.push(`/jobs/${job._id}/apply`)}>
								Apply now!
							</Button>
						</div>
					</div>
					<div
						className="w-full text-black dark:text-white md:ml-8"
						dangerouslySetInnerHTML={{
							__html: tailwindHtml(mdParser.render(job.body)),
						}}
					/>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(
	async (ctx: GetServerSidePropsContext & { req: { session: Session } }) => {
		const user = await ctx.req.session.get("user");

		const { id: jobId } = ctx.query;
		if (!jobId) {
			return {
				redirect: {
					destination: `/jobs`,
					permanent: false,
				},
			};
		}

		const db = await dbConnect();

		let query: { _id: string; active?: boolean } = {
			_id: jobId.toString(),
		};
		if (!user || !user.developer) {
			query.active = true;
		}

		const job = (await db.collection("jobs").findOne(query)) as Job;
		if (!job) {
			return {
				redirect: {
					destination: `/jobs`,
					permanent: false,
				},
			};
		} else {
			if (user && job.applicants?.includes(user.id)) {
				job.alreadyApplied = true;
			} else {
				job.alreadyApplied = false;
			}
			delete job.applicants;
			return {
				props: { job, user: user ?? null },
			};
		}
	}
);
