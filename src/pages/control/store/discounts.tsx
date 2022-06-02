import axios from "axios";
import { formatDistance } from "date-fns";
import { GetServerSideProps } from "next";
import { ReactNode, useEffect, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { toast } from "react-toastify";
import { AnyProduct } from "src/pages/store";
import Checkbox from "src/components/ui/Checkbox";
import Input from "src/components/store/Input";
import clsx from "clsx";
import ProductEditor from "src/components/control/store/ProductEditor";
import CheckboxHead from "src/components/control/store/CheckboxHead";
import Dropdown from "src/components/ui/Dropdown";
import { Icon as Iconify } from "@iconify/react";
import Button from "src/components/ui/Button";
import ProductCreator from "src/components/control/store/ProductCreator";
import ControlLinks from "src/components/control/ControlLinks";
import Table, { ColumnData, SortingState } from "src/components/control/Table";
import DiscountRow, { Discount } from "src/components/control/Table/rows/Discounts";

enum TableHeaders {
	NAME = 0,
	CODE = 1,
	REDEMPTIONS = 2,
	CREATED = 3,
	EXPIRES = 4,
}

export default function ManageDiscounts({ user }: PageProps) {
	const [discounts, setDiscounts] = useState<Discount[]>([]);
	const [displayedDiscounts, setDisplayedDiscounts] = useState<Discount[]>([]);
	const [editing, setEditing] = useState(false);
	const [editorContent, setEditorContent] = useState<ReactNode>();
	const [discountToEdit, setDiscountToEdit] = useState<Discount | null>(null);

	const [filterSearch, setFilterSearch] = useState("");
	const [filterSelectAll, setFilterSelectAll] = useState(false);
	const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

	const [showOptionsFor, setShowOptionsFor] = useState<string>("");

	const [tableHeads, setTableHeads] = useState<ColumnData[]>([
		{
			type: "Unsortable",
			content: <CheckboxHead change={setFilterSelectAll} />,
			width: "w-10",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Name",
			width: "w-80",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Code",
			width: "w-max",
			hidden: false,
		},
		{
			type: "Unsortable",
			content: "Discount amount",
			width: "w-60 !px-0",
			hidden: false,
		},
		{
			type: "Unsortable",
			content: "Duration",
			width: "w-36 !px-0",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Redemptions",
			width: "w-32",
			rtl: true,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Created",
			width: "w-52",
			rtl: true,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Expires",
			width: "w-52",
			rtl: true,
			hidden: false,
		},
		{
			type: "Unsortable",
			content: <></>,
			width: "w-10",
			hidden: false,
		},
	]);

	useEffect(() => {
		// Do api request for discount data
		axios("/api/discounts/list").then(({ data }) => {
			setDiscounts(data);
			setDisplayedDiscounts(data);
		});
	}, []);

	useEffect(() => {
		if (filterSelectAll) {
			return setSelectedDiscounts(displayedDiscounts.map((product) => product.id));
		} else {
			return setSelectedDiscounts(
				selectedDiscounts.length >= 1 && selectedDiscounts.length !== displayedDiscounts.length
					? selectedDiscounts
					: []
			);
		}
	}, [filterSelectAll]);

	useEffect(() => {
		setDisplayedDiscounts(discounts.filter((prod) => prod.name.toLowerCase().includes(filterSearch.toLowerCase())));
	}, [filterSearch]);

	useEffect(() => {
		if (filterSelectAll && selectedDiscounts.length !== displayedDiscounts.length) {
			setFilterSelectAll(false);
		}
	}, [selectedDiscounts]);

	useEffect(() => {
		if (!discountToEdit) {
			setEditing(false);
		} else {
			setEditorContent(<></>);
			setEditing(true);
		}
	}, [discountToEdit]);

	const changeSorting = (selector: number, state: SortingState) => {
		switch (selector) {
			case TableHeaders.NAME:
				if (state === SortingState.ASCENDING) {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => a.name.localeCompare(b.name))]);
				} else {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => b.name.localeCompare(a.name))]);
				}
				break;
			case TableHeaders.CODE:
				if (state === SortingState.ASCENDING) {
					setDisplayedDiscounts([
						...displayedDiscounts.sort((a, b) => (a.code ?? "").localeCompare(b.code ?? "")),
					]);
				} else {
					setDisplayedDiscounts([
						...displayedDiscounts.sort((a, b) => (b.code ?? "").localeCompare(a.code ?? "")),
					]);
				}
				break;
			case TableHeaders.REDEMPTIONS:
				if (state === SortingState.ASCENDING) {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => b.redemptions - a.redemptions)]);
				} else {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => a.redemptions - b.redemptions)]);
				}
				break;
			case TableHeaders.CREATED:
				if (state === SortingState.ASCENDING) {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => (b.created || 0) - (a.created || 0))]);
				} else {
					setDisplayedDiscounts([...displayedDiscounts.sort((a, b) => (a.created || 0) - (b.created || 0))]);
				}
				break;
			case TableHeaders.EXPIRES:
				if (state === SortingState.ASCENDING) {
					setDisplayedDiscounts([...discounts.sort((a, b) => (b.expires || 0) - (a.expires || 0))]);
				} else {
					setDisplayedDiscounts([...discounts.sort((a, b) => (a.expires || 0) - (b.expires || 0))]);
				}
				break;
		}
	};

	const changeColumnVisibility = (i: number, newState: boolean) => {
		let _tableHeads = [...tableHeads];
		_tableHeads[i].hidden = newState;

		setTableHeads(_tableHeads);
	};

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
								value={filterSearch}
								onChange={(e) => setFilterSearch(e.target.value)}
							/>
						</div>
						<div className="order-2 mt-8 flex items-center justify-center space-x-4">
							<div className="">
								<Dropdown
									content={
										<div
											className={clsx(
												"flex items-center justify-center",
												"rounded-md border-[1px] border-[#3C3C3C]",
												"bg-light-500 transition-colors dark:bg-dark-100 dark:text-neutral-400 hover:dark:text-neutral-200",
												"w-40 px-3 py-2 text-sm"
											)}
										>
											<p>Visible columns</p>
											<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
										</div>
									}
									options={tableHeads.map((column, i) => {
										if (typeof column.name === "string") {
											return {
												label: (
													<div className="flex items-center justify-start">
														<Checkbox
															state={!column.hidden}
															style={"fill"}
															className="!mt-0"
															callback={() => changeColumnVisibility(i, !column.hidden)}
														>
															<p className="text-sm">{column.name}</p>
														</Checkbox>
													</div>
												),
											};
										} else {
											return null;
										}
									})}
									isInput={false}
									requireScroll={false}
								/>
							</div>
							<Button variant="primary" className="w-max" onClick={createProduct}>
								Create a Discount
							</Button>
						</div>
					</div>
					<Table heads={tableHeads} sort={changeSorting}>
						{displayedDiscounts.map((discount, i) => (
							<DiscountRow
								key={discount.id}
								id={discount.id}
								hiddenColumns={tableHeads.map((c) => c.hidden)}
								reverseOptions={displayedDiscounts.length - 2 <= i}
								selected={selectedDiscounts.includes(discount.id)}
								name={discount.name}
								code={discount.code}
								discountAmount={discount.discountAmount}
								duration={discount.duration}
								redemptions={discount.redemptions}
								created={discount.created}
								expires={discount.expires}
								select={() => setSelectedDiscounts((discounts) => [...discounts, discount.id])}
								deselect={() =>
									setSelectedDiscounts((discounts) => discounts.filter((id) => id !== discount.id))
								}
								showOptionsFor={setShowOptionsFor}
								showOptions={showOptionsFor === discount.id}
								editProduct={() => {
									setShowOptionsFor("");
									setDiscountToEdit(discount);
								}}
							/>
						))}
					</Table>
				</div>
			</main>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
