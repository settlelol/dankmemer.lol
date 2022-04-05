import axios from "axios";
import { formatDistance } from "date-fns";
import { GetServerSideProps } from "next";
import { ReactNode, useEffect, useRef, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { Icon as Iconify } from "@iconify/react";
import Button from "src/components/ui/Button";
import Tooltip from "src/components/ui/Tooltip";
import { toast } from "react-toastify";
import { AnyProduct } from "src/pages/store";
import Checkbox from "src/components/ui/Checkbox";
import Input from "src/components/store/Input";
import ProductRow from "src/components/control/store/ProductRow";
import { TableHeadersState } from "src/components/control/TableSortIcon";
import TableHead from "src/components/control/TableHead";
import clsx from "clsx";

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
}

interface UnfilterableColumnData {
	type: "Unsortable";
	name?: never;
	selector?: never;
	content: ReactNode;
	width: string;
}

export default function ManageProducts({ user }: PageProps) {
	const [salesData, setSalesData] = useState<SalesData | null>(null);
	const [products, setProducts] = useState<AnyProduct[]>([]);
	const [displayedProducts, setDisplayedProducts] = useState<AnyProduct[]>(
		[]
	);
	const [editing, setEditing] = useState("");

	const [filterSearch, setFilterSearch] = useState("");
	const [filterTableHeaders, setFilterTableHeaders] =
		useState<TableHeaders | null>();
	const [filterTableHeadersState, setFilterTableHeadersState] =
		useState<TableHeadersState>(TableHeadersState.BOTTOM);

	const [filterSelectAll, setFilterSelectAll] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

	const [selectedPrimaryBody, setSelectedPrimaryBody] = useState("");
	const [selectedSecondaryBody, setSelectedSecondaryBody] = useState("");
	const [selectedPrimaryTitle, setSelectedPrimaryTitle] = useState("");
	const [selectedSecondaryTitle, setSelectedSecondaryTitle] = useState("");

	const TableHeads = useRef<
		(FilterableColumnData | UnfilterableColumnData)[]
	>([
		{
			type: "Unsortable",
			content: (
				<Checkbox
					className="mt-0"
					state={filterSelectAll}
					style="fill"
					callback={() => setFilterSelectAll((curr) => !curr)}
				>
					<></>
				</Checkbox>
			),
			width: "w-10",
		},
		{
			type: "Sortable",
			name: "Name",
			width: "w-1/5",
			selector: TableHeaders.NAME,
		},
		{
			type: "Sortable",
			name: "Prices",
			width: "w-48",
			selector: TableHeaders.PRICES,
		},
		{
			type: "Sortable",
			name: "Last updated",
			width: "w-44",
			selector: TableHeaders.LAST_UPDATED,
		},
		{
			type: "Sortable",
			name: "Total sales",
			width: "w-[100px]",
			selector: TableHeaders.TOTAL_SALES,
			rtl: true,
		},
		{
			type: "Sortable",
			name: "Total revenue",
			width: "w-52",
			selector: TableHeaders.TOTAL_REVENUE,
			rtl: true,
		},
		{
			type: "Unsortable",
			content: <></>,
			width: "w-10",
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

	// TODO: (Blue) Make a better alternative for editing a selected product rather than just
	// having the fields below the product.

	const selectProduct = (id: string) => {
		axios(`/api/store/product/details?id=${id}`)
			.then(({ data }) => {
				setSelectedPrimaryTitle(data.primaryTitle || "");
				setSelectedSecondaryTitle(data.secondaryTitle || "");
				setSelectedSecondaryBody(data.secondaryBody || "");
				setSelectedPrimaryBody(data.primaryBody || "");
				setEditing(id);
			})
			.catch(() => {
				setSelectedPrimaryTitle("");
				setSelectedSecondaryTitle("");
				setSelectedSecondaryBody("");
				setSelectedPrimaryBody("");
				setEditing(id);
			});
	};

	const saveEdits = () => {
		if (editing.length < 1) return;
		if (selectedPrimaryTitle.length < 5)
			return toast.error("A primary title is required.");
		if (selectedPrimaryBody.length < 100)
			return toast.error(
				"Primary body length should be greater than 100 characters"
			);
		axios({
			url: "/api/store/product/update?productId=" + editing,
			method: "PUT",
			data: {
				primaryTitle: selectedPrimaryTitle,
				secondaryTitle: selectedSecondaryTitle,
				primaryBody: selectedPrimaryBody,
				secondaryBody: selectedSecondaryBody,
			},
		});
	};

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

	return (
		<ControlPanelContainer title={"Manage Products"} user={user}>
			<div className="mx-8">
				<div className="my-10 flex min-h-screen flex-col">
					<div className="font-montserrat text-3xl font-bold text-dank-300 dark:text-light-100">
						Products
					</div>
					<div className="mt-8">
						<Input
							icon="bx:search"
							width="w-full"
							className="mt-8 !bg-light-500 dark:!bg-dark-100"
							placeholder="Search for a product name"
							type={"search"}
							value={filterSearch}
							onChange={(e) => setFilterSearch(e.target.value)}
						/>
					</div>
					<table
						style={{ borderSpacing: "0 0.2rem" }}
						className="mt-4 border-separate overflow-hidden rounded-lg border-none text-left text-neutral-600 dark:text-neutral-300"
					>
						<thead>
							<tr className="select-none font-inter">
								{TableHeads.current.map((data, i) =>
									data.type === "Sortable" ? (
										<TableHead
											key={i}
											type={data.type}
											name={data.name}
											width={data.width}
											state={filterTableHeadersState}
											active={
												filterTableHeaders ===
												data.selector
											}
											rtl={data.rtl}
											className={clsx(
												i === 0 && "rounded-l-lg",
												i ===
													TableHeads.current.length &&
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
												i === 0 && "rounded-l-lg",
												i ===
													TableHeads.current.length -
														1 && "rounded-r-lg",
												"px-5"
											)}
											type={data.type}
											content={data.content}
											width={data.width}
										/>
									)
								)}
								<th></th>
							</tr>
						</thead>
						{/* Required to add additional spacing between the thead and tbody elements */}
						<div className="h-4" />
						<tbody>
							{displayedProducts.map((product) => (
								<ProductRow
									id={product.id}
									selected={selectedProducts.includes(
										product.id
									)}
									name={product.name}
									image={product.images[0]}
									lastUpdated={
										product.metadata.lastUpdated
											? formatDistance(
													new Date(
														parseInt(
															product.metadata
																.lastUpdated
														)
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
												(price.price / 100).toFixed(2)
										)
										.join(" or ")}
									sales={
										salesData?.productSales.find(
											(prod) => prod._id === product.id
										)?.sales!
									}
									revenue={
										salesData?.productSales.find(
											(prod) => prod._id === product.id
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
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(developerRoute);
