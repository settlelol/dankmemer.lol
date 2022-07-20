import axios from "axios";
import { formatRelative } from "date-fns";
import { GetServerSideProps } from "next";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import Checkbox from "src/components/ui/Checkbox";
import Input from "src/components/store/Input";
import Button from "src/components/ui/Button";
import ControlLinks from "src/components/control/ControlLinks";
import Table from "src/components/control/Table";
import { toTitleCase } from "src/util/string";
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
import ColumnSelector from "src/components/control/Table/ColumnSelector";
import LoadingPepe from "src/components/LoadingPepe";
import Pagination from "src/components/control/Table/Pagination";

export interface Discount {
	id: string;
	name: string;
	code?: string | null;
	discountAmount: DiscountAmount;
	duration: Duration;
	redemptions: number;
	created: number;
	expires?: number | null;
}

interface DiscountAmount {
	percent?: number | null;
	dollars?: number | null;
}

interface Duration {
	label: string;
	months?: number | null;
}

export default function ManageDiscounts({ user }: PageProps) {
	const { current: table } = useRef(createTable().setRowType<Discount>().setOptions({ enableSorting: true }));
	const [loading, setLoading] = useState(true);
	const [discounts, setDiscounts] = useState<Discount[]>([]);

	const [columnVisibility, setColumnVisibility] = useState({});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: document.documentElement.clientHeight >= 850 ? 10 : 9,
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
			table.createDataColumn("name", {
				header: "Name",
				minSize: 320,
			}),
			table.createDataColumn("code", {
				header: "Code",
				size: 144,
				cell: (code) => code.getValue() ?? <>&mdash;</>,
			}),
			table.createDataColumn("discountAmount", {
				id: "discount_amount",
				header: "Discount amount",
				size: 240,
				enableSorting: false,
				cell: (amount) =>
					amount.getValue().percent ? (
						<>{amount.getValue().percent}% off</>
					) : amount.getValue().dollars ? (
						<>${(amount.getValue().dollars! / 100).toFixed(2)} off</>
					) : (
						<>&mdash;</>
					),
			}),
			table.createDataColumn("duration", {
				header: "Duration",
				size: 144,
				enableSorting: false,
				cell: (duration) =>
					duration.getValue().months ? (
						<>{duration.getValue().months} months</>
					) : (
						toTitleCase(duration.getValue().label)
					),
			}),
			table.createDataColumn("redemptions", {
				id: `rtl_redemptions`,
				header: "Redemptions",
				size: 144,
			}),
			table.createDataColumn("created", {
				id: `rtl_created`,
				header: "Created",
				size: 208,
				cell: (created) =>
					created.getValue() ? (
						formatRelative(new Date(created.getValue() * 1000).getTime(), new Date().getTime())
					) : (
						<>&mdash;</>
					),
			}),
			table.createDataColumn("expires", {
				id: `rtl_expires`,
				header: "Expires",
				size: 208,
				cell: (expires) =>
					expires.getValue() ? (
						formatRelative(new Date(expires.getValue()! * 1000).getTime(), new Date().getTime())
					) : (
						<>&mdash;</>
					),
			}),
		],
		[]
	);

	const instance = useTableInstance(table, {
		data: discounts,
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

	useEffect(() => {
		axios("/api/store/discounts/list").then(({ data }) => {
			setDiscounts(data);
			setLoading(false);
		});

		window.addEventListener("resize", recalculateRowCount);
		return () => {
			window.removeEventListener("resize", recalculateRowCount);
		};
	}, []);

	const createDiscount = () => {
		if (
			confirm(
				"Due to too many options being available when creating a discount, I made the decision to just redirect you to the Stripe dashboard.\n\nConfirm here to be redirected to the Stripe dashboard to create a coupon."
			)
		) {
			window
				.open(
					`https://dashboard.stripe.com/${
						process.env.NODE_ENV !== "production" && process.env.IN_TESTING ? "test/" : "/"
					}coupons/create`,
					"_blank"
				)
				?.focus();
		}
	};

	return (
		<ControlPanelContainer title={"Manage Discounts"} links={<ControlLinks user={user!} />}>
			<main>
				<div className="flex flex-col">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Discounts
					</div>
					<div className="flex w-full items-center justify-between space-x-10">
						<div className="order-1 mt-5 grow">
							<Input
								icon="bx:search"
								width="w-full"
								className="!bg-light-500 dark:!bg-dark-100"
								placeholder="Search for a discount"
								type={"search"}
								value={(instance.getColumn("name").getFilterValue() ?? "") as string}
								onChange={(e) => instance.getColumn("name").setFilterValue(e.target.value)}
							/>
						</div>
						<div className="order-2 mt-5 flex items-center justify-center space-x-4">
							<ColumnSelector instance={instance} />
							<Button variant="primary" className="w-max" onClick={createDiscount}>
								Create a Discount
							</Button>
						</div>
					</div>
					<section className="flex flex-col space-y-5 overflow-x-auto xl:overflow-x-hidden">
						{loading ? (
							<LoadingPepe />
						) : discounts.length >= 1 ? (
							<Table instance={instance} minWidth={1190} />
						) : (
							<p>No discounts exist</p>
						)}
					</section>
					<Pagination instance={instance} />
				</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
