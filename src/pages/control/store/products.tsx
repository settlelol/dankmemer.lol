import axios from "axios";
import { GetServerSideProps } from "next";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { toast } from "react-toastify";
import { AnyProduct } from "src/pages/store";
import Checkbox from "src/components/ui/Checkbox";
import Input from "src/components/store/Input";
import ProductEditor from "src/components/control/store/ProductEditor";
import Button from "src/components/ui/Button";
import ProductCreator from "src/components/control/store/ProductCreator";
import ControlLinks from "src/components/control/ControlLinks";
import Table from "src/components/control/Table";
import ColumnSelector from "src/components/control/Table/ColumnSelector";
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
import Stripe from "stripe";
import Tooltip from "src/components/ui/Tooltip";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { formatRelative } from "date-fns";
import LoadingPepe from "src/components/LoadingPepe";

export interface ProductSales {
	_id: string;
	sales: number;
	revenue: number;
}

interface Price {
	value: number;
}

export interface ProductData {
	id: string;
	image: string;
	name: string;
	prices: Price[];
	activeSubscriptions: number;
	type: Stripe.Price.Type;
	lastUpdated: number;
	totalSales: number;
	totalRevenue: number;
}

export default function ManageProducts({ user }: PageProps) {
	const { current: table } = useRef(createTable().setRowType<ProductData>().setOptions({ enableSorting: true }));
	const [loading, setLoading] = useState(true);
	const [products, setProducts] = useState<ProductData[]>([]);
	const [editing, setEditing] = useState(false);
	const [editorContent, setEditorContent] = useState<ReactNode>();
	const [productToEdit, setProductToEdit] = useState("");

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
			table.createDataColumn("name", {
				header: "Name",
				minSize: 320,
				cell: (name) => (
					<div className="flex items-center justify-start space-x-4">
						<div
							className={clsx(
								"rounded-md bg-black/10 bg-light-500 bg-center bg-no-repeat dark:bg-dark-100",
								"h-10 w-10 bg-[length:33px_33px]"
							)}
							style={{
								backgroundImage: `url('${name.row.original!.image}')`,
							}}
						/>
						<span>{name.getValue()}</span>
					</div>
				),
			}),
			table.createDataColumn("prices", {
				header: "Price(s)",
				size: 144,
				cell: (prices) =>
					prices.getValue() ? (
						prices
							.getValue()
							.sort((a, b) => a.value - b.value)
							.map((price) => "$" + (price.value / 100).toFixed(2).toLocaleString())
							.join(" or ")
					) : (
						<>&mdash;</>
					),
			}),
			table.createDataColumn("type", {
				header: "Type",
				size: 40,
				enableSorting: false,
				cell: (type) => (
					<div className="px-4">
						{type.getValue() === "recurring" ? (
							<Tooltip content="Subscription">
								<Iconify icon="wpf:recurring-appointment" className="text-green-500" />
							</Tooltip>
						) : (
							<Tooltip content="One-time purchase">
								<Iconify icon="akar-icons:shipping-box-01" className="text-teal-600" height={18} />
							</Tooltip>
						)}
					</div>
				),
			}),
			table.createDataColumn("lastUpdated", {
				id: "rtl_last_updated",
				header: "Last Updated",
				size: 144,
				cell: (date) => formatRelative(new Date(date.getValue() * 1000).getTime(), new Date().getTime()),
			}),
			table.createDataColumn("activeSubscriptions", {
				id: `rtl_active_subscriptions`,
				header: "Active subscriptions",
				size: 208,
				cell: (subs) => (subs.row.original!.type && subs.getValue() >= 1 ? subs.getValue() : <>&mdash;</>),
			}),
			table.createDataColumn("totalSales", {
				id: `rtl_total_sales`,
				header: "Total sales",
				size: 144,
				cell: (sales) => (sales.getValue() >= 1 ? sales.getValue() : <>&mdash;</>),
			}),
			table.createDataColumn("totalRevenue", {
				id: `rtl_total_revenue`,
				header: "Total revenue",
				size: 208,
				cell: (revenue) =>
					revenue.getValue() >= 1 ? "$" + revenue.getValue().toFixed(2).toLocaleString() : <>&mdash;</>,
			}),
			table.createDisplayColumn({
				id: "rtl_actions",
				enableResizing: false,
				enableHiding: false,
				header: "",
				cell: ({ row }) => (
					<div className="-mr-6 grid place-items-center">
						<Iconify
							icon="akar-icons:edit"
							height={18}
							className="cursor-pointer hover:!text-dank-100"
							onClick={() => setProductToEdit(row.original!.id)}
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
		data: products,
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

	useEffect(() => {
		axios("/api/store/products/data")
			.then(({ data }) => {
				setProducts(data);
				setLoading(false);
			})
			.catch((e) => {
				console.error(e);
				toast.error("Unable to get store products.");
			});
	}, []);

	useEffect(() => {
		if (!productToEdit) {
			setEditing(false);
		} else {
			setEditorContent(<ProductEditor id={productToEdit} />);
			setEditing(true);
		}
	}, [productToEdit]);

	const createProduct = () => {
		setEditorContent(<ProductCreator forceHide={() => setEditing(false)} />);
		setEditing(true);
	};

	return (
		<ControlPanelContainer
			title={"Manage Products"}
			hideRightPane={() => {
				if (confirm("Are you sure you want to close the editor? All unsaved changes will be lost.")) {
					setEditing(false);
					setTimeout(() => {
						setProductToEdit("");
					}, 400);
				}
			}}
			rightPaneVisible={editing}
			rightPaneContent={editorContent}
			links={<ControlLinks user={user!} />}
		>
			<main>
				<div className="flex min-h-screen flex-col">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">Products</div>
					<div className="flex w-full items-center justify-between space-x-10">
						<div className="order-1 grow">
							<Input
								icon="bx:search"
								width="w-full"
								className="mt-8 !bg-light-500 dark:!bg-dark-100"
								placeholder="Search for a product name"
								type={"search"}
								value={(instance.getColumn("name").getFilterValue() ?? "") as string}
								onChange={(e) => instance.getColumn("name").setFilterValue(e.target.value)}
							/>
						</div>
						<div className="order-2 mt-8 flex items-center justify-center space-x-4">
							<ColumnSelector instance={instance} />
							<Button variant="primary" className="w-max" onClick={createProduct}>
								Add product
							</Button>
						</div>
					</div>
					<section className="flex flex-col space-y-5">
						{loading ? (
							<LoadingPepe />
						) : products.length >= 1 ? (
							<Table instance={instance} />
						) : (
							<p>No purchases made</p>
						)}
					</section>
				</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
