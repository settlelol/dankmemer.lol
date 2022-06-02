import axios from "axios";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Container from "src/components/control/Container";
import DashboardLinks from "src/components/control/DashboardLinks";
import PurchaseRow from "src/components/control/Table/rows/Purchases";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import { PageProps } from "src/types";
import { authenticatedRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import { AggregatedPurchaseRecordPurchases } from "../api/customers/history";
import Input from "src/components/store/Input";
import PurchaseViewer from "src/components/dashboard/account/purchases/PurchaseViewer";
import Table, { ColumnData, SortingState } from "src/components/control/Table";

enum TableHeaders {
	ORDER = 0,
	DATE = 1,
	COST = 2,
	GOODS = 3,
}

export default function PurchaseHistory({ user }: PageProps) {
	const [loading, setLoading] = useState(true);
	const [viewing, setViewing] = useState(false);
	const [viewingPurchase, setViewingPurchase] = useState<AggregatedPurchaseRecordPurchases | undefined>();
	const [purchases, setPurchases] = useState<AggregatedPurchaseRecordPurchases[]>([]);

	const [displayedPurchases, setDisplayedPurchases] = useState<AggregatedPurchaseRecordPurchases[]>([]);

	const [filterSearch, setFilterSearch] = useState("");
	const [filterTableHeaders, setFilterTableHeaders] = useState<TableHeaders | null>();
	const [filterTableHeadersState, setFilterTableHeadersState] = useState<SortingState>(SortingState.DESCENDING);
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
			hidden: false,
		},
		{
			type: "Sortable",
			name: "Cost",
			width: "min-w-[110px]",
			rtl: true,
			hidden: false,
		},
		{
			type: "Sortable",
			name: "# of Goods",
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
		axios(`/api/customers/history?id=${user!.id}`)
			.then(({ data }) => {
				setPurchases(
					(data.history.purchases as AggregatedPurchaseRecordPurchases[]).sort(
						(a, b) => b.purchaseTime - a.purchaseTime
					)
				);
				setDisplayedPurchases(
					(data.history.purchases as AggregatedPurchaseRecordPurchases[]).sort(
						(a, b) => b.purchaseTime - a.purchaseTime
					)
				);
			})
			.catch(() => {
				console.error("no history");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		setDisplayedPurchases(
			purchases.filter((purchase) => purchase._id.toLowerCase().includes(filterSearch.toLowerCase()))
		);
	}, [filterSearch]);

	const changeSorting = (selector: TableHeaders, state: SortingState) => {
		switch (selector) {
			case TableHeaders.ORDER:
				if (state === SortingState.ASCENDING) {
					setDisplayedPurchases([...displayedPurchases.sort((a, b) => a._id.localeCompare(b._id))]);
				} else {
					setDisplayedPurchases([...displayedPurchases.sort((a, b) => b._id.localeCompare(a._id))]);
				}
				break;
			case TableHeaders.COST:
				if (state === SortingState.ASCENDING) {
					setDisplayedPurchases([
						...displayedPurchases.sort(
							(a, b) =>
								a.items.reduce((prev, curr) => prev + curr.price, 0) -
								b.items.reduce((prev, curr) => prev + curr.price, 0)
						),
					]);
				} else {
					setDisplayedPurchases([
						...displayedPurchases.sort(
							(a, b) =>
								b.items.reduce((prev, curr) => prev + curr.price, 0) -
								a.items.reduce((prev, curr) => prev + curr.price, 0)
						),
					]);
				}
				break;
			case TableHeaders.DATE:
				if (state === SortingState.ASCENDING) {
					setDisplayedPurchases([...displayedPurchases.sort((a, b) => b.purchaseTime - a.purchaseTime)]);
				} else {
					setDisplayedPurchases([...displayedPurchases.sort((a, b) => a.purchaseTime - b.purchaseTime)]);
				}
				break;
			case TableHeaders.GOODS:
				if (state === SortingState.ASCENDING) {
					setDisplayedPurchases([
						...displayedPurchases.sort(
							(a, b) =>
								a.items.reduce((prev, curr) => prev + curr.quantity, 0) -
								b.items.reduce((prev, curr) => prev + curr.quantity, 0)
						),
					]);
				} else {
					setDisplayedPurchases([
						...displayedPurchases.sort(
							(a, b) =>
								b.items.reduce((prev, curr) => prev + curr.quantity, 0) -
								a.items.reduce((prev, curr) => prev + curr.quantity, 0)
						),
					]);
				}
				break;
		}
	};

	const showPurchase = (purchase: AggregatedPurchaseRecordPurchases) => {
		setViewingPurchase(purchase);
		setViewing(true);
	};

	return (
		<Container
			title="Purchase History"
			links={<DashboardLinks user={user!} />}
			hideRightPane={() => setViewing(false)}
			rightPaneVisible={viewing}
			rightPaneContent={<PurchaseViewer purchase={viewingPurchase!} />}
		>
			<main>
				<Title size="big">Purchase history</Title>
				<p className="text-neutral-600 dark:text-neutral-400">
					View and manage all previously purchased goods from our store which are linked to your account.
				</p>
				<div className="flex w-full items-center justify-between space-x-10">
					<div className="order-1 grow">
						<Input
							icon="bx:search"
							width="w-full"
							className="mt-8 !bg-light-500 dark:!bg-dark-100"
							placeholder="Search for an order's ID"
							type={"search"}
							value={filterSearch}
							onChange={(e) => setFilterSearch(e.target.value)}
						/>
					</div>
				</div>
				<section className="flex flex-col space-y-5">
					{loading ? (
						<LoadingPepe />
					) : purchases.length >= 1 ? (
						<Table heads={tableHeads} sort={changeSorting}>
							{displayedPurchases.map((purchase) => (
								<PurchaseRow
									key={purchase._id}
									purchase={purchase}
									viewDetails={() => showPurchase(purchase)}
								/>
							))}
						</Table>
					) : (
						<p>No purchases made</p>
					)}
				</section>
			</main>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(authenticatedRoute);
