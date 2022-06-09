import axios from "axios";
import { GetServerSideProps } from "next";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Container from "src/components/control/Container";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import Input from "src/components/store/Input";
import PurchaseViewer from "src/components/dashboard/account/purchases/PurchaseViewer";
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
import { AggregatedPurchaseRecordPurchases as AggregatedPurchaseRecord } from "src/pages/api/customers/[userId]/history";
import Button from "src/components/ui/Button";
import PurchaseFinder from "src/components/control/store/PurchaseFinder";
import Pagination from "src/components/control/Table/Pagination";

export default function PurchaseHistory({ user }: PageProps) {
	const { current: table } = useRef(
		createTable().setRowType<AggregatedPurchaseRecord>().setOptions({ enableSorting: true })
	);

	const [loading, setLoading] = useState(true);
	const [viewing, setViewing] = useState(false);
	const [viewingPurchase, setViewingPurchase] = useState<AggregatedPurchaseRecord>();
	const [rightPane, setRightPane] = useState(
		<PurchaseViewer purchase={viewingPurchase!} userId={user!.id} staffView />
	);
	const [purchases, setPurchases] = useState<AggregatedPurchaseRecord[]>([]);

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
						{row.original!.type === "single" ? (
							<Tooltip content="Single">
								<Iconify icon="akar-icons:shipping-box-01" className="text-teal-600" height={18} />
							</Tooltip>
						) : (
							<Tooltip content="Subscription">
								<Iconify icon="wpf:recurring-appointment" className="text-green-500" />
							</Tooltip>
						)}
					</div>
				),
				size: 40,
				maxSize: 40,
			}),
			table.createDataColumn("boughtBy", {
				id: "bought_by",
				header: "Purchased by",
			}),
			table.createDataColumn("_id", {
				header: "Order ID",
				cell: (id) => (
					<p className="flex items-center justify-start space-x-2">
						<span>{id.getValue()}</span>
						{id.row.original?.isGift ? (
							<Tooltip content={`Gifted to: ${id.row.original?.giftFor}`}>
								<Iconify icon="bxs:gift" height={16} />
							</Tooltip>
						) : (
							""
						)}
						{id.row.original?.refundStatus !== undefined && (
							<Tooltip content={"This purchase has a pending refund request"}>
								<Iconify icon="gridicons:refund" height={16} className="text-red-500" />
							</Tooltip>
						)}
					</p>
				),
				size: 320,
			}),
			table.createDataColumn("gateway", {
				header: "Payment processor",
				enableSorting: false,
				cell: (processor) => (processor.getValue() === "paypal" ? "PayPal" : "Stripe"),
			}),
			table.createDataColumn("purchaseTime", {
				id: "rtl_date",
				header: "Purchase date",
				cell: (date) => <>{formatRelative(new Date(date.getValue()), new Date())}</>,
			}),
			table.createDataColumn("items", {
				id: "rtl_cost",
				header: `Cost (incl. tax) before discounts`,
				cell: (items) => {
					const subtotal = items.getValue().reduce((curr: number, item) => curr + item.price, 0);
					return <>${(subtotal + subtotal * 0.0675).toFixed(2)}</>;
				},
				size: 240,
			}),
			table.createDataColumn("items", {
				id: "rtl_items",
				header: "# of Goods",
				cell: (items) => <>{items.getValue().reduce((prev, curr) => prev + curr.quantity, 0)}</>,
				size: 80,
			}),
			table.createDisplayColumn({
				id: "ng_actions",
				header: "",
				cell: ({ row }) => (
					<div className="ml-3 grid w-full place-items-center">
						<Iconify
							icon="fluent:expand-up-left-16-filled"
							hFlip={true}
							height={18}
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
		data: purchases,
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
		axios(`/api/customers/purchases`)
			.then(({ data }) => {
				setPurchases(data.history);
			})
			.catch(() => {
				console.error("no history");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const showPurchase = (purchase: AggregatedPurchaseRecord) => {
		setRightPane(<PurchaseViewer purchase={purchase!} userId={user!.id} staffView />);
		setViewingPurchase(purchase);
		setViewing(true);
	};

	return (
		<Container
			title="Purchase History"
			links={<ControlLinks user={user!} />}
			hideRightPane={() => setViewing(false)}
			rightPaneVisible={viewing}
			rightPaneContent={rightPane}
		>
			<main>
				<Title size="big">Recent purchases</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					View the most recent purchases made through the web store.{" "}
					<b>Limited to 100 results to cut down on load times</b>
				</p>
				<div className="flex w-full items-center justify-between space-x-10">
					<div className="order-1 grow">
						<Input
							icon="bx:search"
							width="w-full"
							className="mt-8 !bg-light-500 dark:!bg-dark-100"
							placeholder="Search for an order's ID"
							type={"search"}
							value={(instance.getColumn("_id").getFilterValue() ?? "") as string}
							onChange={(e) => instance.getColumn("_id").setFilterValue(e.target.value)}
						/>
					</div>
					<div className="order-2 mt-8 flex items-center justify-center space-x-4">
						<Button
							variant="primary"
							className="w-max"
							onClick={() => {
								setViewing(true);
								setRightPane(<PurchaseFinder showPurchase={showPurchase} />);
							}}
						>
							Find a specific purchase
						</Button>
					</div>
				</div>
				<section className="flex flex-col space-y-5 overflow-x-auto xl:overflow-x-hidden">
					{loading ? (
						<LoadingPepe />
					) : purchases.length >= 1 ? (
						<Table instance={instance} minWidth={1460} />
					) : (
						<p>No purchases made</p>
					)}
				</section>
				<Pagination instance={instance} />
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
