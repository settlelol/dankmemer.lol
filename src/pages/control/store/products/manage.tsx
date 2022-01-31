import axios from "axios";
import { formatDistance } from "date-fns";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import ControlPanelContainer from "src/components/control/Container";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import Stripe from "stripe";
import { Icon as Iconify } from "@iconify/react";
import Button from "src/components/ui/Button";
import Tooltip from "src/components/ui/Tooltip";
import { toast } from "react-toastify";

interface SubscriptionPrice {
	id: string;
	price: number;
	interval: string;
}

interface AnyProduct extends Stripe.Product {
	price?: number;
	prices?: SubscriptionPrice[];
}

export default function ManageProducts({ user }: PageProps) {
	const [products, setProducts] = useState<AnyProduct[]>([]);
	const [editing, setEditing] = useState("");

	const [selectedPrimaryBody, setSelectedPrimaryBody] = useState("");
	const [selectedSecondaryBody, setSelectedSecondaryBody] = useState("");
	const [selectedPrimaryTitle, setSelectedPrimaryTitle] = useState("");
	const [selectedSecondaryTitle, setSelectedSecondaryTitle] = useState("");

	useEffect(() => {
		setProducts([]);
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
					setProducts((_products) => [
						..._products,
						...subscriptions,
					]);
					setProducts((_products) => [..._products, ...onetime]);
				})
			)
			.catch(() => {
				toast.error("Unable to get store products.");
			});
	}, []);

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
				<div className="flex flex-col my-10 min-h-screen">
					<div className="font-bold font-montserrat text-3xl text-dank-300 dark:text-light-100">
						Store Products
					</div>
					<table className="mt-8 p-4 text-left bg-light-500 text-dark-400 dark:text-light-200 dark:bg-dark-100 border-none border-collapse rounded-lg overflow-hidden">
						<thead>
							<tr className="border-b-2 border-white/20">
								<th className="w-[60px]"></th>
								<th className="w-2/12 py-3">Name</th>
								<th className="w-48 py-3">Prices</th>
								<th className="w-44 py-3">Last updated</th>
								<th className="w-2/12">Total purchases</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{products.map((product) => (
								<>
									<tr
										key={product.id}
										className="border-t-[1px] border-black/10 dark:border-white/20"
									>
										<td className="p-3">
											<img
												src={product.images[0]}
												width={32}
											/>
										</td>
										<td>{product.name}</td>
										<td className="text-sm">
											{product.price ? (
												<p>
													<span className="text-dank-300">
														$
														{(
															product.price / 100
														).toFixed(2)}
													</span>{" "}
													for one
												</p>
											) : (
												product.prices
													?.sort(
														(a, b) =>
															a.price - b.price
													)
													?.map((price) => (
														<p className="mb-1">
															<span className="text-dank-300">
																$
																{(
																	price.price /
																	100
																).toFixed(2)}
															</span>{" "}
															per {price.interval}
														</p>
													))
											)}
										</td>
										<td>
											{product.metadata.lastUpdated
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
												: "Unknown"}
										</td>
										<td>
											{product.metadata.purchaseCount?.toLocaleString() ??
												(0).toLocaleString()}
										</td>
										<td>
											<Iconify
												icon="akar-icons:edit"
												height={20}
												className="cursor-pointer hover:!text-dank-100"
												onClick={() =>
													selectProduct(product.id)
												}
											/>
										</td>
									</tr>
									{editing === product.id && (
										<tr>
											<td colSpan={3} className="p-3">
												<div className="flex flex-col justify-start">
													<label
														htmlFor="includes"
														className="mb-2"
													>
														Product includes
														<sup className="text-red-500">
															*
														</sup>
														<Tooltip content="Markdown is supported for this field">
															<Iconify
																icon="akar-icons:info"
																className="inline-flex mb-1 ml-2 opacity-30"
															/>
														</Tooltip>
													</label>
													<textarea
														id="includes"
														className="px-2 py-1 bg-light-200 dark:bg-dank-600 resize-none h-40 rounded-md text-sm focus-visible:outline focus-visible:outline-[1px] focus-visible:outline-dank-200"
														defaultValue={
															selectedPrimaryBody
														}
														onChange={(e) =>
															setSelectedPrimaryBody(
																e.target.value
															)
														}
													></textarea>
												</div>
											</td>
											<td colSpan={2}>
												<div className="flex flex-col justify-start">
													<label
														htmlFor="also-includes"
														className="mb-2"
													>
														Additionally included
														<Tooltip content="Markdown is supported for this field">
															<Iconify
																icon="akar-icons:info"
																className="inline-flex mb-1 ml-1 opacity-30"
															/>
														</Tooltip>
													</label>
													<textarea
														id="also-includes"
														className="px-2 py-1 bg-light-200 dark:bg-dank-600 resize-none h-40 rounded-md text-sm focus-visible:outline focus-visible:outline-[1px] focus-visible:outline-dank-200"
														defaultValue={
															selectedSecondaryBody
														}
														onChange={(e) =>
															setSelectedSecondaryBody(
																e.target.value
															)
														}
													></textarea>
												</div>
											</td>
											<td
												colSpan={1}
												className="p-3 align-top"
											>
												<div className="flex flex-col justify-start">
													<div className="flex flex-col justify-start">
														<label
															htmlFor="primary-title"
															className="mb-2"
														>
															Primary title
															<sup className="text-red-500">
																*
															</sup>
														</label>
														<input
															id="primary-title"
															type="text"
															className="bg-light-200 dark:bg-dank-600 rounded-md px-2 py-1 focus-visible:outline focus-visible:outline-[1px] focus-visible:outline-dank-200"
															placeholder="Exclusive benefits"
															defaultValue={
																selectedPrimaryTitle
															}
															onChange={(e) =>
																setSelectedPrimaryTitle(
																	e.target
																		.value
																)
															}
														/>
													</div>
													<div className="flex flex-col justify-start">
														<label
															htmlFor="primary-title"
															className="mb-2"
														>
															Secondary title
														</label>
														<input
															id="secondary-title"
															type="text"
															className="bg-light-200 dark:bg-dank-600 rounded-md px-2 py-1 focus-visible:outline focus-visible:outline-[1px] focus-visible:outline-dank-200"
															placeholder="Also included"
															defaultValue={
																selectedSecondaryTitle
															}
															onChange={(e) =>
																setSelectedSecondaryTitle(
																	e.target
																		.value
																)
															}
														/>
													</div>
													<Button
														className="mt-6"
														size={"medium-large"}
														onClick={saveEdits}
													>
														<p>
															Save changes to '
															{product.name}'
														</p>
													</Button>
												</div>
											</td>
										</tr>
									)}
								</>
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
