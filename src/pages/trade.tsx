import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Ad } from "../components/Ad";
import { Title } from "../components/Title";
import Box from "../components/ui/Box";
import Button from "../components/ui/Button";
import Container from "../components/ui/Container";
import { Item, PageProps } from "../types";
import { unauthenticatedRoute } from "../util/redirects";
import { withSession } from "../util/session";

const itemsData = require("../data/itemsData.json");

interface ItemBoxProps {
	side: string;
	trade: Trade;
	item: Item;
	update: (side: string, id: string, value: number) => void;
}

function ItemBox({ item, side, trade, update }: ItemBoxProps) {
	return (
		<div
			className={clsx(
				"mb-4 flex h-24 w-32 items-center justify-center rounded-md bg-light-500 p-2 dark:bg-dark-100",
				trade[side].items[item.id] >= 1 && "border-2 border-dank-300"
			)}
		>
			<div className="flex flex-col items-center space-y-1">
				<img src={item.image} className="h-6 w-6" />
				<div className="text-center text-xs text-dark-500 dark:text-white">
					{item.name}
				</div>
				<div className="flex items-center justify-center bg-gray-300 text-sm text-dark-500 dark:bg-dark-400 dark:text-white">
					<div
						className="select-none px-1 font-bold"
						onClick={(e) => {
							update(
								side,
								item.id,
								(trade[side].items[item.id] || 0) - 1
							);
							e.stopPropagation();
						}}
					>
						-
					</div>
					<input
						className="w-12 resize-none overflow-hidden border-none bg-transparent text-center outline-none"
						placeholder="Boxes"
						onChange={(e) =>
							update(side, item.id, parseFloat(e.target.value))
						}
						value={trade[side].items[item.id] || 0}
					/>
					<div
						className="select-none px-1 font-bold"
						onClick={(e) => {
							update(
								side,
								item.id,
								(trade[side].items[item.id] || 0) + 1
							);
							e.stopPropagation();
						}}
					>
						+
					</div>
				</div>
			</div>
		</div>
	);
}

type Trade = Record<
	string,
	{
		coins: number;
		items: Record<Item["id"], number>;
	}
>;

export default function TradePage({ user }: PageProps) {
	const allItems = Object.values(itemsData as Record<Item["id"], Item>)
		.sort((a, z) => a.name.localeCompare(z.name))
		.filter((i) => !i.notSharable);
	const [items, setItems] = useState(allItems);
	const [trade, setTrade] = useState<Trade>({
		left: { coins: 0, items: {} },
		right: { coins: 0, items: {} },
	});
	const [command, setCommand] = useState("pls trade");
	const [error, setError] = useState("");

	const updateItem = (side: string, id: string, value: number) => {
		if (typeof value !== "number" || isNaN(value)) {
			value = 0;
		}
		value = Math.min(1e9, Math.max(0, value));

		const copy = { ...trade };

		copy[side].items[id] = value;

		Object.entries(copy).forEach(([side, trade]) =>
			Object.entries(trade.items).forEach(([id, number]) => {
				if (number == 0) {
					delete trade.items[id];
				}
			})
		);

		setTrade(copy);
	};

	const updateCoins = (side: string, coins: number) => {
		if (typeof coins !== "number" || isNaN(coins)) {
			coins = 0;
		}
		coins = Math.min(5e9, Math.max(0, coins));

		const copy = { ...trade };

		copy[side].coins = coins;

		setTrade(copy);
	};

	const resetTrade = () => {
		setTrade({
			left: { coins: 0, items: {} },
			right: { coins: 0, items: {} },
		});
	};

	useEffect(() => {
		let error = "";

		if (trade.left.coins > 0 && trade.right.coins > 0) {
			error = "Coins on both sides";
		}

		Object.entries(trade).forEach(([side, sideData]) => {
			if (
				(sideData.coins ? 1 : 0) + Object.keys(sideData.items).length >
				10
			) {
				error = `Too many values on the ${side} side.`;
			}

			Object.entries(sideData.items).forEach(([id, number]) => {
				if (
					Object.keys(
						trade[side == "left" ? "right" : "left"].items
					).find((i) => i == id)
				) {
					error = `'${itemsData[id].name}' item is on both sides.`;
				}
			});
		});

		const leftEmpty =
			!trade.left.coins && !Object.keys(trade.left.items).length;
		const righEmpty =
			!trade.right.coins && !Object.keys(trade.right.items).length;

		if (leftEmpty && righEmpty) {
			error = "Both sides are empty.";
		} else if (leftEmpty) {
			error = "Left side is empty.";
		} else if (righEmpty) {
			error = "Right side is empty.";
		}

		const generated = Object.values(trade)
			.map(
				(trade) =>
					Object.entries(trade.items)
						.map(([id, number]) => `${number} ${id}`)
						.join(" ") +
					(trade.coins > 0 ? ` ${trade.coins} coins` : "")
			)
			.join(", ");

		setCommand(`pls trade ${generated} @user`);
		setError(error);
	}, [trade]);

	return (
		<Container title="Trade Generator" user={user}>
			<div className="mt-20">
				<Ad
					id="top"
					platform="mobile"
					sizes={[
						[320, 50],
						[300, 50],
						[300, 250],
					]}
				/>
				<Ad id="top" platform="desktop" sizes={[[728, 90]]} />
			</div>
			<div className="my-20 flex flex-col space-y-4">
				<div className="flex flex-col space-y-2">
					<Title size="big">Trade Generator</Title>
					<div className="flex flex-col space-y-8">
						<div>
							<div className="flex flex-col items-center space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-2">
								<Box
									size="sm"
									className="flex h-9 w-full flex-1 items-center overflow-hidden whitespace-nowrap rounded-md  text-gray-900 dark:text-white md:w-auto"
								>
									{command}
								</Box>
								<Button
									className=" w-full md:w-auto"
									variant="dark"
									onClick={() => {
										navigator.clipboard.writeText(
											command.replace(/\@user/g, "@")
										);
										toast.dark("Copied!");
									}}
								>
									Copy
								</Button>
								<Button
									variant="dark"
									className=" w-full md:w-auto"
									onClick={() => resetTrade()}
								>
									Reset
								</Button>
							</div>
							{error.length > 0 ? (
								<div className="text-red-500">
									Invalid Trade: {error}
								</div>
							) : (
								<div className="block"></div>
							)}
						</div>

						<div className="flex space-x-12">
							{Object.keys(trade).map((side) => (
								<div className="flex flex-col space-y-4">
									<div className="-mb-4 font-montserrat text-lg font-bold text-dark-500 dark:text-white">
										{side == "left" ? "You" : "Someone"}
									</div>
									<textarea
										className={clsx(
											"h-8 w-full resize-none overflow-hidden rounded-md bg-light-500 px-2 py-1.5 text-right text-sm text-black placeholder-gray-500 outline-none dark:bg-dark-100 dark:text-light-300",
											trade[side].coins > 0
												? "border-2 border-dank-300"
												: "border-2 border-white dark:border-dark-100 "
										)}
										maxLength={22}
										onChange={(e) =>
											updateCoins(
												side,
												parseInt(e.target.value)
											)
										}
										value={trade[side].coins}
										placeholder={""}
									/>

									<div className="flex flex-wrap items-center justify-between">
										{items.map((item) => (
											<ItemBox
												item={item}
												trade={trade}
												side={side}
												update={updateItem}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<Ad
					id="bottom"
					platform="mobile"
					sizes={[
						[320, 50],
						[300, 50],
						[300, 250],
					]}
				/>
				<Ad
					id="bottom"
					platform="desktop"
					sizes={[
						[728, 90],
						[970, 90],
					]}
				/>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(unauthenticatedRoute);
