import axios from "axios";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Container from "src/components/control/Container";
import DashboardLinks from "src/components/control/DashboardLinks";
import TableHead from "src/components/control/TableHead";
import { TableHeadersState } from "src/components/control/TableSortIcon";
import PurchaseRow from "src/components/dashboard/account/purchases/PurchaseRow";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { AggregatedPurchaseRecord, AggregatedPurchaseRecordPurchases } from "../api/customers/history";
import { FilterableColumnData, UnfilterableColumnData } from "../control/store/products/manage";

type ColumnData = (Omit<FilterableColumnData, "selector"> & { selector: TableHeaders }) | UnfilterableColumnData;
enum TableHeaders {
	ORDER = 1,
	DATE = 2,
	COST = 3,
	GOODS = 4,
}

export default function PurchaseHistory({ user }: PageProps) {
	const [loading, setLoading] = useState(true);
	const [purchases, setPurchases] = useState<AggregatedPurchaseRecordPurchases[]>([]);

	const [filterTableHeaders, setFilterTableHeaders] = useState<TableHeaders | null>();
	const [filterTableHeadersState, setFilterTableHeadersState] = useState<TableHeadersState>(TableHeadersState.BOTTOM);
	const [tableHeads, setTableHeads] = useState<ColumnData[]>([
		{
			type: "Unsortable",
			content: <></>,
			width: "w-10",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Order ID",
			width: "w-3/12",
			selector: TableHeaders.ORDER,
			hidden: false,
		},
		{
			type: "Unsortable",
			content: <>Gift</>,
			width: "w-max",
			hidden: false,
		},
		{
			type: "Unsortable",
			content: "Gifted to",
			width: "w-3/12",
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Purchase date",
			width: "min-w-[156px]",
			selector: TableHeaders.DATE,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Cost",
			width: "min-w-[110px]",
			selector: TableHeaders.COST,
			rtl: true,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "# of Goods",
			width: "w-52",
			selector: TableHeaders.GOODS,
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
		axios(`/api/customers/history?id=${user!.id}`)
			.then(({ data }) => {
				setPurchases(data.history.purchases);
			})
			.catch(() => {
				console.error("no history");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const changeSorting = (id: TableHeaders, state: TableHeadersState) => {
		console.log(id, state);
	};

	return (
		<Container title="Purchase History" links={<DashboardLinks user={user!} />}>
			<main>
				<Title size="big">Purchase history</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					View and manage all previously purchased goods from our store which are linked to your account.
				</p>
				<section className="mt-10 flex flex-col space-y-5">
					{loading ? (
						<LoadingPepe />
					) : purchases.length >= 1 ? (
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
													state={filterTableHeadersState}
													active={filterTableHeaders === data.selector}
													rtl={data.rtl}
													className={clsx(
														i === 0 && "rounded-l-lg",
														i === tableHeads.length && "rounded-r-lg"
													)}
													onClick={() =>
														changeSorting(
															data.selector,
															filterTableHeadersState === TableHeadersState.TOP
																? TableHeadersState.BOTTOM
																: TableHeadersState.TOP
														)
													}
												/>
											) : (
												<TableHead
													key={i}
													className={clsx(
														i === 0 && "rounded-l-lg",
														i === tableHeads.length - 1 && "rounded-r-lg",
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
								{purchases.map((purchase) => (
									<PurchaseRow purchase={purchase} />
								))}
							</tbody>
						</table>
					) : (
						<p>No purchases made</p>
					)}
				</section>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
