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
import ProductCreator from "src/components/control/store/ProductCreator";
import ControlLinks from "src/components/control/ControlLinks";
import Table from "src/components/control/Table";
import { Discount } from "src/components/control/Table/rows/Discounts";
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

export default function ManageDiscounts({ user }: PageProps) {
	const { current: table } = useRef(createTable().setRowType<Discount>().setOptions({ enableSorting: true }));
	const [discounts, setDiscounts] = useState<Discount[]>([]);
	const [editing, setEditing] = useState(false);
	const [editorContent, setEditorContent] = useState<ReactNode>();
	const [discountToEdit, setDiscountToEdit] = useState<Discount | null>(null);

	const [showOptionsFor, setShowOptionsFor] = useState<string>("");

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

	useEffect(() => {
		axios("/api/discounts/list").then(({ data }) => {
			setDiscounts(data);
		});
	}, []);

	useEffect(() => {
		if (!discountToEdit) {
			setEditing(false);
		} else {
			setEditorContent(<></>);
			setEditing(true);
		}
	}, [discountToEdit]);

	const createProduct = () => {
		setEditorContent(<ProductCreator forceHide={() => setEditing(false)} />);
		setEditing(true);
	};

	return (
		<ControlPanelContainer
			title={"Manage Discounts"}
			hideRightPane={() => {
				if (confirm("Are you sure you want to close the editor? All unsaved changes will be lost.")) {
					setEditing(false);
					setTimeout(() => {
						setDiscountToEdit(null);
					}, 400);
				}
			}}
			rightPaneVisible={editing}
			rightPaneContent={editorContent}
			links={<ControlLinks user={user!} />}
		>
			<main>
				<div className="flex min-h-screen flex-col">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Discounts
					</div>
					<div className="flex w-full items-center justify-between space-x-10">
						<div className="order-1 grow">
							<Input
								icon="bx:search"
								width="w-full"
								className="mt-8 !bg-light-500 dark:!bg-dark-100"
								placeholder="Search for a discount"
								type={"search"}
								value={(instance.getColumn("name").getFilterValue() ?? "") as string}
								onChange={(e) => instance.getColumn("name").setFilterValue(e.target.value)}
							/>
						</div>
						<div className="order-2 mt-8 flex items-center justify-center space-x-4">
							<ColumnSelector instance={instance} />
							<Button variant="primary" className="w-max" onClick={createProduct}>
								Create a Discount
							</Button>
						</div>
					</div>
					<Table instance={instance} />
				</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
