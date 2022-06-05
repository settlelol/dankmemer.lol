import axios from "axios";
import { GetServerSideProps } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import Container from "src/components/control/Container";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import Input from "src/components/store/Input";
import PurchaseViewer, { Refund, RefundStatus } from "src/components/dashboard/account/purchases/PurchaseViewer";
import Table from "src/components/control/Table";
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
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import { formatRelative } from "date-fns";
import ControlLinks from "src/components/control/ControlLinks";
import { toTitleCase } from "src/util/string";

export default function Refunds({ user }: PageProps) {
	const { current: table } = useRef(createTable().setRowType<Refund>().setOptions({ enableSorting: true }));

	const [loading, setLoading] = useState(true);
	const [viewing, setViewing] = useState(false);
	const [viewingPurchase, setViewingPurchase] = useState<Refund>();
	const [refunds, setRefunds] = useState<Refund[]>([]);

	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const columns = useMemo(
		() => [
			table.createDisplayColumn({
				id: "ng_type",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<div className="-ml-3 grid w-full place-items-center">
						{RefundStatus[row.original!.status.toString() as any].toLowerCase().startsWith("open") ? (
							<Tooltip content="Status">
								<Iconify icon="akar-icons:clock" className="text-green-500" height={18} />
							</Tooltip>
						) : (
							<Tooltip content="Status">
								<Iconify icon="carbon:error" className="text-red-500" height={18} />
							</Tooltip>
						)}
					</div>
				),
				size: 40,
				maxSize: 40,
			}),
			table.createDataColumn("purchasedBy", {
				id: "bought_by",
				header: "Purchased by",
			}),
			table.createDataColumn("order", {
				header: "Order ID",
				size: 320,
			}),
			table.createDataColumn("gateway", {
				header: "Payment processor",
				enableSorting: false,
				cell: (processor) => (processor.getValue() === "paypal" ? "PayPal" : "Stripe"),
			}),
			table.createDataColumn("reason", {
				header: `Reason`,
				size: 240,
			}),
			table.createDataColumn("status", {
				header: "Status",
				cell: (status) =>
					toTitleCase(
						RefundStatus[status.getValue().toString() as any]
							.toLowerCase()
							.replace(/_/g, " ")
							.replace("open", "")
							.replace("closed", "")
							.trim()
					),
			}),
			table.createDataColumn("createdAt", {
				id: "rtl_date",
				header: "Date lodged",
				cell: (date) => <>{formatRelative(new Date(date.getValue() * 1000), new Date())}</>,
			}),
			table.createDisplayColumn({
				id: "ng_actions",
				header: "",
				cell: ({ row }) => (
					<div className="ml-3 grid w-full place-items-center">
						<Iconify
							icon="ic:round-manage-search"
							height={20}
							className="cursor-pointer"
							onClick={() => showPurchase(row.original!)}
						/>
					</div>
				),
				size: 40,
				maxSize: 40,
			}),
		],
		[]
	);

	const instance = useTableInstance(table, {
		data: refunds,
		columns,
		state: {
			sorting,
			pagination,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	useEffect(() => {
		axios(`/api/customers/refunds`)
			.then(({ data }) => {
				setRefunds(data.refunds);
			})
			.catch(() => {
				console.error("no refunds");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const showPurchase = (purchase: Refund) => {
		setViewingPurchase(purchase);
		setViewing(true);
	};

	return (
		<Container
			title="Purchase History"
			links={<ControlLinks user={user!} />}
			hideRightPane={() => setViewing(false)}
			rightPaneVisible={viewing}
			rightPaneContent={<></>}
		>
			<main>
				<Title size="big">Refund requests</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					Both closed and open refund requests can be seen here.
				</p>
				<div className="flex w-full items-center justify-between space-x-10">
					<div className="order-1 grow">
						<Input
							icon="bx:search"
							width="w-full"
							className="mt-8 !bg-light-500 dark:!bg-dark-100"
							placeholder="Search for an order's ID"
							type={"search"}
							value={(instance.getColumn("order").getFilterValue() ?? "") as string}
							onChange={(e) => instance.getColumn("order").setFilterValue(e.target.value)}
						/>
					</div>
				</div>
				<section className="flex flex-col space-y-5">
					{loading ? (
						<LoadingPepe />
					) : refunds.length >= 1 ? (
						<Table instance={instance} />
					) : (
						<p>No refunds have been made</p>
					)}
				</section>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
