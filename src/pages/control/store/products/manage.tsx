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
import ProductRow from "src/components/control/store/ProductRow";
import { TableHeadersState } from "src/components/control/TableSortIcon";
import TableHead from "src/components/control/TableHead";
import clsx from "clsx";
import ProductEditor from "src/components/control/store/ProductEditor";
import CheckboxHead from "src/components/control/store/CheckboxHead";
import Dropdown from "src/components/ui/Dropdown";
import { Icon as Iconify } from "@iconify/react";
import Button from "src/components/ui/Button";
import ProductCreator from "src/components/control/store/ProductCreator";

interface SalesData {
	productSales: ProductSales[];
}

interface ProductSales {
	_id: string;
	sales: number;
	revenue: number;
}

enum TableHeaders {
	NAME = 0,
	PRICES = 1,
	LAST_UPDATED = 2,
	TOTAL_SALES = 3,
	TOTAL_REVENUE = 4,
}

interface FilterableColumnData {
	type: "Sortable";
	name: string;
	selector: TableHeaders;
	content?: never;
	width: string;
	rtl?: boolean;
	hidden: boolean;
}

interface UnfilterableColumnData {
	type: "Unsortable";
	name?: never;
	selector?: never;
	content: ReactNode;
	width: string;
	hidden: boolean;
}

export default function ManageProducts({ user }: PageProps) {
	const [salesData, setSalesData] = useState<SalesData | null>(null);
	const [products, setProducts] = useState<AnyProduct[]>([]);
	const [displayedProducts, setDisplayedProducts] = useState<AnyProduct[]>(
		[]
	);
	const [editing, setEditing] = useState(false);
	const [editorContent, setEditorContent] = useState<ReactNode>();
	const [productToEdit, setProductToEdit] = useState<AnyProduct | null>(null);

	const [filterSearch, setFilterSearch] = useState("");
	const [filterTableHeaders, setFilterTableHeaders] =
		useState<TableHeaders | null>();
	const [filterTableHeadersState, setFilterTableHeadersState] =
		useState<TableHeadersState>(TableHeadersState.BOTTOM);

	const [filterSelectAll, setFilterSelectAll] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

	const [showOptionsFor, setShowOptionsFor] = useState<string>("");

	const [tableHeads, setTableHeads] = useState<
		(FilterableColumnData | UnfilterableColumnData)[]
	>([
		{
			type: "Unsortable",
			content: <CheckboxHead change={setFilterSelectAll} />,
			width: "w-10",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Name",
			width: "w-4/12",
			selector: TableHeaders.NAME,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Prices",
			width: "w-max",
			selector: TableHeaders.PRICES,
			hidden: false,
		},
		{
			type: "Unsortable",
			content: "Type",
			width: "w-13",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Last updated",
			width: "min-w-[156px]",
			selector: TableHeaders.LAST_UPDATED,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Total sales",
			width: "min-w-[110px]",
			selector: TableHeaders.TOTAL_SALES,
			rtl: true,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Total revenue",
			width: "w-52",
			selector: TableHeaders.TOTAL_REVENUE,
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
		const StoreAPI = axios.create({
			baseURL: "/api/store/products",
		});
		axios
			.all([
				StoreAPI.get("/subscriptions/list"),
				StoreAPI.get("/one-time/list"),
			])
			.then(
				axios.spread(({ data: subscriptions }, { data: onetime }) => {
					const receivedProducts = [...subscriptions, ...onetime];
					setProducts(receivedProducts);
					setDisplayedProducts(receivedProducts);
				})
			)
			.catch(() => {
				toast.error("Unable to get store products.");
			});
	}, []);

	useEffect(() => {
		if (products.length <= 1) return;
		axios(`/api/store/products/data`)
			.then(({ data }) => {
				setSalesData(data);
			})
			.catch((e) => console.error(e));
	}, [products]);

	useEffect(() => {
		if (filterSelectAll) {
			return setSelectedProducts(
				displayedProducts.map((product) => product.id)
			);
		} else {
			return setSelectedProducts(
				selectedProducts.length >= 1 &&
					selectedProducts.length !== displayedProducts.length
					? selectedProducts
					: []
			);
		}
	}, [filterSelectAll]);

	useEffect(() => {
		setDisplayedProducts(
			products.filter((prod) =>
				prod.name.toLowerCase().includes(filterSearch.toLowerCase())
			)
		);
	}, [filterSearch]);

	useEffect(() => {
		if (
			filterSelectAll &&
			selectedProducts.length !== displayedProducts.length
		) {
			setFilterSelectAll(false);
		}
	}, [selectedProducts]);

	useEffect(() => {
		if (!productToEdit) {
			setEditing(false);
		} else {
			setEditorContent(
				<ProductEditor
					id={productToEdit.id}
					name={productToEdit.name}
					description={productToEdit.description || ""}
				/>
			);
			setEditing(true);
		}
	}, [productToEdit]);

	const changeSorting = (
		selector: TableHeaders,
		state: TableHeadersState
	) => {
		setFilterTableHeaders(selector);
		setFilterTableHeadersState(state);

		switch (selector) {
			case TableHeaders.NAME:
				if (state === TableHeadersState.TOP) {
					setDisplayedProducts((products) =>
						products.sort((a, b) => a.name.localeCompare(b.name))
					);
				} else {
					setDisplayedProducts((products) =>
						products.sort((a, b) => b.name.localeCompare(a.name))
					);
				}
				break;
			case TableHeaders.PRICES:
				if (state === TableHeadersState.TOP) {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) => a.prices[0].price - b.prices[0].price
						)
					);
				} else {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								b.prices.reduce(
									(prev, { price: curr }) => prev + curr,
									0
								) -
								a.prices.reduce(
									(prev, { price: curr }) => prev + curr,
									0
								)
						)
					);
				}
				break;
			case TableHeaders.LAST_UPDATED:
				if (state === TableHeadersState.TOP) {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(parseInt(b.metadata.lastUpdated) || 0) -
								(parseInt(a.metadata.lastUpdated) || 0)
						)
					);
				} else {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(parseInt(a.metadata.lastUpdated) || 0) -
								(parseInt(b.metadata.lastUpdated) || 0)
						)
					);
				}
				break;
			case TableHeaders.TOTAL_SALES:
				if (state === TableHeadersState.TOP) {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(salesData?.productSales.find(
									(prod) => prod._id === a.id
								)?.sales || 0) -
								(salesData?.productSales.find(
									(prod) => prod._id === b.id
								)?.sales || 0)
						)
					);
				} else {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(salesData?.productSales.find(
									(prod) => prod._id === b.id
								)?.sales || 0) -
								(salesData?.productSales.find(
									(prod) => prod._id === a.id
								)?.sales || 0)
						)
					);
				}
				break;
			case TableHeaders.TOTAL_REVENUE:
				if (state === TableHeadersState.TOP) {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(salesData?.productSales.find(
									(prod) => prod._id === a.id
								)?.revenue || 0) -
								(salesData?.productSales.find(
									(prod) => prod._id === b.id
								)?.revenue || 0)
						)
					);
				} else {
					setDisplayedProducts((products) =>
						products.sort(
							(a, b) =>
								(salesData?.productSales.find(
									(prod) => prod._id === b.id
								)?.revenue || 0) -
								(salesData?.productSales.find(
									(prod) => prod._id === a.id
								)?.revenue || 0)
						)
					);
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
		setEditorContent(<ProductCreator />);
		setEditing(true);
	};

	return (
		<ControlPanelContainer
			title={"Manage Products"}
			user={user}
			hideRightPane={() => {
				if (
					confirm(
						"Are you sure you want to close the editor? All unsaved changes will be lost."
					)
				) {
					setEditing(false);
					setTimeout(() => {
						setProductToEdit(null);
					}, 400);
				}
			}}
			rightPaneVisible={editing}
			rightPaneContent={editorContent}
		>
			<div className="ml-8 mr-16">
				<div className="my-10 flex min-h-screen flex-col lg:mt-16">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Products
					</div>
					<div className="flex w-full items-center justify-between space-x-10">
						<div className="order-1 grow">
							<Input
								icon="bx:search"
								width="w-full"
								className="mt-8 !bg-light-500 dark:!bg-dark-100"
								placeholder="Search for a product name"
								type={"search"}
								value={filterSearch}
								onChange={(e) =>
									setFilterSearch(e.target.value)
								}
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
											<Iconify
												icon="ic:baseline-expand-more"
												height={15}
												className="ml-1"
											/>
										</div>
									}
									options={tableHeads.map((column, i) => {
										if (typeof column.name === "string") {
											return {
												label: (
													<div className="flex items-center justify-start">
														<Checkbox
															state={
																!column.hidden
															}
															style={"fill"}
															className="!mt-0"
															callback={() =>
																changeColumnVisibility(
																	i,
																	!column.hidden
																)
															}
														>
															<p className="text-sm">
																{column.name}
															</p>
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
							<Button
								variant="primary"
								className="w-max"
								onClick={createProduct}
							>
								Add product
							</Button>
						</div>
					</div>
					<div>
						<table
							style={{ borderSpacing: "0 0.3rem" }}
							className="relative mt-4 w-full border-separate overflow-hidden rounded-lg border-none text-left text-neutral-600 dark:text-neutral-300"
						>
							<thead>
								<tr className="select-none font-inter">
									{tableHeads.map(
										(data, i) =>
											!data.hidden &&
											(data.type === "Sortable" ? (
												<TableHead
													key={i}
													type={data.type}
													name={data.name}
													width={data.width}
													state={
														filterTableHeadersState
													}
													active={
														filterTableHeaders ===
														data.selector
													}
													rtl={data.rtl}
													className={clsx(
														i === 0 &&
															"rounded-l-lg",
														i ===
															tableHeads.length &&
															"rounded-r-lg"
													)}
													onClick={() =>
														changeSorting(
															data.selector,
															TableHeadersState.opposite(
																filterTableHeadersState
															)
														)
													}
												/>
											) : (
												<TableHead
													key={i}
													className={clsx(
														i === 0 &&
															"rounded-l-lg",
														i ===
															tableHeads.length -
																1 &&
															"rounded-r-lg",
														"px-5"
													)}
													type={data.type}
													content={data.content}
													width={data.width}
												/>
											))
									)}
								</tr>
							</thead>
							{/* Required to add additional spacing between the thead and tbody elements */}
							<div className="h-4" />
							<tbody>
								{displayedProducts.map((product, i) => (
									<ProductRow
										id={product.id}
										hiddenColumns={tableHeads.map(
											(c) => c.hidden
										)}
										reverseOptions={
											displayedProducts.length - 2 <= i
										}
										selected={selectedProducts.includes(
											product.id
										)}
										name={product.name}
										image={product.images[0]}
										lastUpdated={
											product.updated
												? formatDistance(
														new Date(
															product.updated *
																1000
														),
														new Date(),
														{
															addSuffix: true,
														}
												  )
												: "Unknown"
										}
										price={product.prices
											.sort((a, b) => a.price - b.price)
											.map(
												(price) =>
													"$" +
													(price.price / 100).toFixed(
														2
													)
											)
											.join(" or ")}
										type={product.prices[0].interval}
										sales={
											salesData?.productSales.find(
												(prod) =>
													prod._id === product.id
											)?.sales!
										}
										revenue={
											salesData?.productSales.find(
												(prod) =>
													prod._id === product.id
											)?.revenue!
										}
										select={() =>
											setSelectedProducts((products) => [
												...products,
												product.id,
											])
										}
										deselect={() =>
											setSelectedProducts((products) =>
												products.filter(
													(id) => id !== product.id
												)
											)
										}
										showOptionsFor={setShowOptionsFor}
										showOptions={
											showOptionsFor === product.id
										}
										editProduct={() => {
											setShowOptionsFor("");
											setProductToEdit(product);
										}}
									/>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
