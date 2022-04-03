import axios from "axios";
import { formatDistance } from "date-fns";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
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

interface SalesData {
	productSales: ProductSales[];
}

interface ProductSales {
	_id: string;
	sales: number;
	revenue: number;
}

export default function ManageProducts({ user }: PageProps) {
	const [salesData, setSalesData] = useState<SalesData | null>(null);
	const [products, setProducts] = useState<AnyProduct[]>([]);
	const [displayedProducts, setDisplayedProducts] = useState<AnyProduct[]>(
		[]
	);
	const [editing, setEditing] = useState("");

	const [filterSearch, setFilterSearch] = useState("");

	const [filterSelectAll, setFilterSelectAll] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

	const [selectedPrimaryBody, setSelectedPrimaryBody] = useState("");
	const [selectedSecondaryBody, setSelectedSecondaryBody] = useState("");
	const [selectedPrimaryTitle, setSelectedPrimaryTitle] = useState("");
	const [selectedSecondaryTitle, setSelectedSecondaryTitle] = useState("");

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
								<th className="w-10 bg-light-500 px-5 first:rounded-l-lg dark:bg-dark-100">
									<Checkbox
										className="mt-0"
										state={filterSelectAll}
										style="fill"
										callback={() =>
											setFilterSelectAll((curr) => !curr)
										}
									>
										<></>
									</Checkbox>
								</th>
								<th className="w-1/5 bg-light-500 py-3 font-normal dark:bg-dark-100">
									Name
								</th>
								<th className="w-48 bg-light-500 py-3 font-normal dark:bg-dark-100">
									Prices
								</th>
								<th className="w-44 bg-light-500 py-3 font-normal dark:bg-dark-100">
									Last updated
								</th>
								<th className="w-[82px] bg-light-500 font-normal dark:bg-dark-100">
									Total sales
								</th>
								<th className="w-32 bg-light-500 text-right font-normal dark:bg-dark-100">
									Total revenue
								</th>
								<th className="w-10 bg-light-500 font-normal last:rounded-r-lg dark:bg-dark-100"></th>
								<th className="bg-light-500 font-normal last:rounded-r-lg dark:bg-dark-100"></th>
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
