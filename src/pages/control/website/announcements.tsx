import { GetServerSideProps } from "next";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { Icon as Iconify } from "@iconify/react";
import { Title } from "src/components/Title";
import Input from "src/components/store/Input";
import Button from "src/components/ui/Button";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "src/components/ui/Link";
import Table from "src/components/control/Table";
import LoadingPepe from "src/components/LoadingPepe";
import Pagination from "src/components/control/Table/Pagination";
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

export interface Announcement {
	_id?: string;
	content: string;
	createdAt: number;
	author?: number | string;
}

export default function Announcements({ user }: PageProps) {
	const { current: table } = useRef(createTable().setRowType<Announcement>().setOptions({ enableSorting: true }));
	const [loading, setLoading] = useState(false);
	const [canSubmit, setCanSubmit] = useState(false);
	const [publishAsLive, setPublishAsLive] = useState(false);
	const [pastAnnouncements, setPastAnnouncements] = useState<Announcement[]>([]);
	const [tempAnnouncementText, setTempAnnouncementText] = useState<string | null>(null);

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
			table.createDataColumn("author", {
				header: "Created by",
				size: 100,
			}),
			table.createDataColumn("content", {
				header: "Content",
				minSize: 900,
				cell: (string) => (
					<p className="overflow-hidden text-ellipsis whitespace-nowrap">{string.getValue()}</p>
				),
			}),
			table.createDataColumn("createdAt", {
				id: "rtl_last_updated",
				header: "Created at",
				size: 50,
				cell: (date) => formatRelative(new Date(date.getValue()).getTime(), new Date().getTime()),
			}),
			// table.createDisplayColumn({
			// 	id: "rtl_actions",
			// 	enableResizing: false,
			// 	enableHiding: false,
			// 	header: "",
			// 	cell: ({ row }) => (
			// 		<div className="-mr-6 grid place-items-center">
			// 			<Iconify icon="akar-icons:edit" height={18} className="cursor-pointer hover:!text-dank-100" />
			// 		</div>
			// 	),
			// 	maxSize: 40,
			// 	size: 40,
			// }),
		],
		[]
	);

	const instance = useTableInstance(table, {
		data: pastAnnouncements,
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

	const recalculateRowCount = () => {
		setPagination({
			pageIndex: 0,
			pageSize: document.documentElement.clientHeight >= 850 ? 10 : 9,
		});
	};

	const retrieveExistingAnnouncements = () => {
		setLoading(true);
		axios("/api/website/announcements/list")
			.then(({ data }) => {
				setPastAnnouncements(data);
			})
			.catch(() => {
				toast.error("Failed to retrieve list of past announcements.");
			})
			.finally(() => {
				setLoading(false);
			});
	};

	const createAnnouncement = () => {
		axios({
			url: "/api/website/announcements/create",
			method: "POST",
			data: {
				live: publishAsLive,
				content: tempAnnouncementText,
			},
		})
			.catch(() => {
				toast.error("Failed to create new announcement, please try again later.");
			})
			.finally(() => {
				setTempAnnouncementText("");
				retrieveExistingAnnouncements();
			});
	};

	useEffect(() => {
		setPastAnnouncements([]);
		retrieveExistingAnnouncements();
		recalculateRowCount();
	}, []);

	useEffect(() => {
		setCanSubmit((tempAnnouncementText ?? "").length >= 1);
	}, [tempAnnouncementText]);

	return (
		<ControlPanelContainer title={"Website Announcements"} links={<ControlLinks user={user!} />}>
			<main>
				<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
					Announcements
				</div>
				<div className="my-5 flex flex-col space-x-10 lg:flex-row lg:items-stretch lg:justify-start">
					<section className="h-max w-full max-w-6xl">
						<div className="h-[648px] w-full rounded bg-neutral-200 dark:bg-black">
							<Announcement content={tempAnnouncementText} />
							<div className="m-auto mt-5 h-12 w-full max-w-xl rounded bg-light-200 dark:bg-dark-200"></div>
						</div>
						<div className="mt-2">
							<Title size="small" className="font-semibold">
								Create a new Announcement
							</Title>
							<div className="my-2 flex w-full flex-row space-x-3">
								<div className="w-full">
									<Input
										width="w-full"
										type="text"
										className="bg-white dark:!bg-dark-200"
										onChange={(e) =>
											setTempAnnouncementText(e.target.value.length >= 1 ? e.target.value : null)
										}
										placeholder='We now have 23 more flavors of donuts included within the Battle Pass! <a href="/battlepass" class="underline">Learn more about the Battle Pass</a>'
									/>
								</div>

								<Button
									size="medium"
									className="h-max"
									disabled={!canSubmit}
									onClick={createAnnouncement}
								>
									Create
								</Button>
							</div>
						</div>
					</section>
					{/* <section className="w-full max-w-sm space-y-2">
						<Title size="small" className="font-semibold">
							Most recent campaign
						</Title>
						<div
							className="rounded-lg bg-neutral-200 py-4 px-5 dark:bg-dark-100"
							style={{ height: "calc(100% - 28px - 8px)" }}
						>
							<p>Started by: {}</p>
						</div>
					</section> */}
				</div>

				{pastAnnouncements.length >= 1 && (
					<>
						<Title size="small" className="font-semibold">
							Previous announcements
						</Title>
						<section className="flex max-w-full flex-col space-y-5 overflow-x-auto xl:overflow-x-hidden">
							{loading ? (
								<LoadingPepe />
							) : pastAnnouncements.length >= 1 ? (
								<Table instance={instance} minWidth={1460} />
							) : (
								<p>No purchases made</p>
							)}
						</section>
						<Pagination instance={instance} />
					</>
				)}
			</main>
		</ControlPanelContainer>
	);
}

export function Announcement({ content, close }: { content: string | null; close?: () => void }) {
	return (
		<div className="relative w-full bg-dank-300 py-1 text-center">
			<p
				className="px-7 text-sm"
				dangerouslySetInnerHTML={{
					__html:
						content ??
						"<span class='text-white/60'>Sample announcement text! Edit this announcement by adding content below.</span>",
				}}
			/>
			<div
				className="absolute right-1 top-1.5 cursor-pointer text-neutral-200 transition-colors hover:text-white"
				{...(close && { onClick: close })}
			>
				<Iconify icon="carbon:close" />
			</div>
		</div>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
