import axios from "axios";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import Dropdown from "src/components/ui/Dropdown";
import Input from "src/components/ui/Input";
import { JOBS_TEAMS } from "src/constants/jobs";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import ControlLinks from "src/components/control/ControlLinks";
import ControlPanelContainer from "src/components/control/Container";
import {
	createTable,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	SortingState,
	useTableInstance,
} from "@tanstack/react-table";
import Checkbox from "src/components/ui/Checkbox";
import { formatRelative } from "date-fns";
import Table from "src/components/control/Table";
import LoadingPepe from "src/components/LoadingPepe";
import Pagination from "src/components/control/Table/Pagination";
import { Icon as Iconify } from "@iconify/react";

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
	requiresResume?: boolean;
	webhook?: string;
}

export default function ControlJobsPage({ user }: PageProps) {
	const router = useRouter();

	const { current: table } = useRef(createTable().setRowType<Job>().setOptions({ enableSorting: true }));
	const [loading, setLoading] = useState(false);

	const [isEditing, setIsEditing] = useState(false);
	const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

	const [currentJobs, setCurrentJobs] = useState([]);

	const [jobTitle, setJobTitle] = useState("");
	const [selectedTeam, setSelectedTeam] = useState("");
	const [jobLocation, setJobLocation] = useState("");
	const [jobRequiresResume, setJobRequiresResume] = useState<boolean | null>(null);
	const [jobCustomWH, setJobCustomWH] = useState("");
	const [jobDescription, setJobDescription] = useState("");
	const [jobBody, setJobBody] = useState("");
	const { edit } = router.query;

	const [columnVisibility, setColumnVisibility] = useState({});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const columns = useMemo(
		() => [
			table.createDisplayColumn({
				id: "select_boxes",
				enableResizing: false,
				enableHiding: false,
				header: ({ instance }) => (
					<Checkbox
						className="mt-0"
						state={instance.getIsAllRowsSelected()}
						style="fill"
						callback={instance.getToggleAllRowsSelectedHandler()}
					>
						<></>
					</Checkbox>
				),
				cell: ({ row }) => (
					<Checkbox
						className="mt-0"
						state={row.getIsSelected()}
						style="fill"
						callback={row.getToggleSelectedHandler()}
					>
						<></>
					</Checkbox>
				),
				maxSize: 40,
				size: 40,
			}),
			table.createDataColumn("title", {
				header: "Job title",
				minSize: 120,
			}),
			table.createDataColumn("active", {
				header: "Status",
				size: 40,
				enableSorting: false,
				cell: (status) =>
					status.getValue() ? <p className="text-dank-100">Active</p> : <p className="text-red-500">False</p>,
			}),
			table.createDataColumn("team", {
				header: "Team",
				size: 100,
			}),
			table.createDataColumn("requiresResume", {
				header: "Requires a resume?",
				enableSorting: false,
				size: 100,
				cell: (bool) => (bool.getValue() ? "Yes" : "No"),
			}),
			table.createDataColumn("applicants", {
				id: "rtl_applicants",
				header: "# of Applicants",
				size: 150,
				cell: (array) => (
					<p>
						{array
							.getValue()
							?.length.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "0"}
					</p>
				),
			}),
			table.createDataColumn("createdAt", {
				id: "rtl_last_updated",
				header: "Created at",
				size: 100,
				cell: (date) => formatRelative(new Date(date.getValue()).getTime(), new Date().getTime()),
			}),
			table.createDisplayColumn({
				id: "rtl_actions",
				enableResizing: false,
				enableHiding: false,
				header: "Actions",
				cell: ({ row }) => (
					<div className="flex items-center justify-end space-x-2">
						<Iconify
							icon={"bx:edit"}
							height={18}
							className="cursor-pointer hover:!text-dank-100"
							onClick={() => editJob(row.original!)}
						/>
						<Iconify
							icon={
								row.original?.active ? "fluent:toggle-right-24-filled" : "fluent:toggle-left-24-regular"
							}
							height={18}
							className="cursor-pointer hover:!text-dank-100"
							onClick={() => toggleJob(row.original!)}
						/>
					</div>
				),
				maxSize: 40,
				size: 40,
			}),
		],
		[]
	);

	const instance = useTableInstance(table, {
		data: currentJobs,
		columns,
		state: {
			sorting,
			pagination,
			columnVisibility,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const getListings = () => {
		axios(`/api/jobs/list?active=any`)
			.then(({ data }) => {
				setCurrentJobs(data);
				if (edit) {
					const job = data.filter((j: Job) => j._id === edit);
					if (job) {
						editJob(job[0]);
						window.history.pushState(null, "", window.location.href.split("?")[0]);
					}
				}
			})
			.catch((e) => {
				console.error(e);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	useEffect(() => {
		setLoading(true);
		getListings();
	}, []);

	const submitJob = async () => {
		try {
			const { data: job } = await axios({
				method: "POST",
				url: isEditing ? `/api/jobs/update?id=${jobToEdit?._id}` : "/api/jobs/create",
				data: {
					title: jobTitle,
					team: selectedTeam,
					location: jobLocation,
					webhook: jobCustomWH,
					requiresResume: jobRequiresResume,
					description: jobDescription,
					body: jobBody,
				},
			});
			toast.success(isEditing ? "Job offer has been updated" : "Job offer has been posted", {
				theme: "colored",
				position: "top-center",
				onClick: () => {
					router.push(`/jobs/${job._id || jobToEdit?._id}`);
				},
			});
		} catch (e) {
			console.error(e);
			toast.error("Error while posting job, check console for more information.");
		}
	};

	const toggleJob = (job: Job) => {
		axios({
			method: "POST",
			url: `/api/jobs/update?id=${job._id}`,
			data: { active: !job.active },
		})
			.then(() => {
				toast.success(`${job.title} has been updated`, {
					position: "top-center",
					theme: "colored",
				});
				axios(`/api/jobs/list?active=any`)
					.then(({ data }) => {
						setCurrentJobs(data);
					})
					.catch((e) => {
						console.error(e);
					});
			})
			.catch((e) => {
				console.error(e);
				toast.error("Something went wrong while toggling the job status.", {
					theme: "colored",
					position: "top-center",
				});
			});
	};

	const editJob = (job: Job) => {
		setIsEditing(true);
		setJobToEdit(job);

		// Update inputs
		setJobTitle(job.title);
		setSelectedTeam(job.team);
		setJobLocation(job.location);
		setJobRequiresResume(job.requiresResume || false);
		setJobCustomWH(job.webhook || "");
		setJobDescription(job.description);
		setJobBody(job.body);
	};

	return (
		<ControlPanelContainer title={"Job listings"} links={<ControlLinks user={user!} />}>
			<main className="flex flex-col space-y-8">
				<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
					Manage Job Listings
				</div>
				<div className="flex flex-col space-y-4">
					<div className="flex w-full flex-col bg-light-500 dark:bg-dark-400">
						<h1 className="font-montserrat text-xl font-bold text-dark-400 dark:text-white">
							{isEditing ? `Editing '${jobToEdit?.title}'` : "Create a Job Offering"}
						</h1>
						<div className="mt-2 flex min-h-[2.5rem] flex-wrap gap-3">
							<div className="">
								<Input
									label="Job title"
									placeholder="Job title"
									variant="short"
									value={jobTitle}
									onChange={(e) => setJobTitle(e.target.value)}
									required
								/>
							</div>
							<div className="">
								<p className="mb-1 text-sm text-black dark:text-white">
									Job's respective team<sup className="text-red-500">*</sup>
								</p>
								<Dropdown
									content={
										<div className="flex w-full items-center justify-between p-2">
											<div className="flex items-center space-x-2">
												<div
													className={clsx(
														"min-w-[180px] text-sm text-dark-400 dark:text-gray-500",
														selectedTeam?.length > 1 ? "dark:!text-neutral-300" : ""
													)}
												>
													{selectedTeam || "Respective team for job"}
												</div>
											</div>

											<div className="material-icons text-dark-100 dark:text-gray-500">
												expand_more
											</div>
										</div>
									}
									options={JOBS_TEAMS.map((option) => ({
										onClick: (e) => {
											setSelectedTeam(option);
										},
										label: option,
									}))}
								/>
							</div>
							<div className="">
								<Input
									label="Job location(s)"
									placeholder="Global, remote"
									variant="short"
									value={jobLocation}
									onChange={(e) => setJobLocation(e.target.value)}
									required
								/>
							</div>
							<div className="">
								<p className="mb-1 text-sm text-black dark:text-white">
									Require a Resume<sup className="text-red-500">*</sup>
								</p>
								<Dropdown
									content={
										<div className="flex w-full items-center justify-between p-2">
											<div className="flex items-center space-x-2">
												<div
													className={clsx(
														"min-w-[100px] text-sm text-dark-400 dark:text-gray-500",
														jobRequiresResume !== null ? "dark:!text-neutral-300" : ""
													)}
												>
													{jobRequiresResume !== null
														? jobRequiresResume
															? "Yes"
															: "No"
														: "Yes/No"}
												</div>
											</div>

											<div className="material-icons text-dark-100 dark:text-gray-500">
												expand_more
											</div>
										</div>
									}
									options={[
										{
											onClick: () => {
												setJobRequiresResume(true);
											},
											label: "Yes",
										},
										{
											onClick: () => {
												setJobRequiresResume(false);
											},
											label: "No",
										},
									]}
								/>
							</div>
						</div>
						<div className="mt-4 flex w-full flex-col">
							<Input
								label="Custom Webhook destination"
								placeholder=""
								variant="short"
								value={jobCustomWH}
								onChange={(e) => setJobCustomWH(e.target.value)}
							/>
						</div>
						<div className="mt-4">
							<Input
								label="Description"
								value={jobDescription}
								onChange={(e) => setJobDescription(e.target.value)}
								variant="medium"
								placeholder="A short description for the job, this is only shown on the jobs page not the job page itself."
								resizable
								block
								required
							/>
						</div>
						<div className="mt-4 mb-4">
							<Input
								label="Job Body"
								value={jobBody}
								onChange={(e) => setJobBody(e.target.value)}
								variant="medium"
								placeholder="This is the job body. Describe who the role is for, their desired past experience and any required skills they should have. Markdown can be used here (and should be used for titles and lists on the job page)"
								resizable
								block
								required
							/>
						</div>
						<Button size="medium" className="max-w-max" onClick={submitJob}>
							{isEditing ? "Save changes" : "Submit"}
						</Button>
					</div>
					<div className="mt-10 w-full rounded-lg bg-light-500 dark:bg-dark-400">
						<Title size="small" className="font-semibold">
							Current Job Listings
						</Title>
						<section className="flex max-w-full flex-col space-y-5 overflow-x-auto xl:overflow-x-hidden">
							{loading ? (
								<LoadingPepe />
							) : currentJobs.length >= 1 ? (
								<Table instance={instance} minWidth={1460} />
							) : (
								<p>No purchases made</p>
							)}
						</section>
						<Pagination instance={instance} />
					</div>
				</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
