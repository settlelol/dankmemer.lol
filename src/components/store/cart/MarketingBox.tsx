import clsx from "clsx";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

export type MarketBoxVariants = "subscriptionSavings" | "gifting" | "perks";
interface Props {
	variant: MarketBoxVariants;
}

export default function MarketingBox({ variant }: Props) {
	const [view, setView] = useState<ReactNode>();

	useEffect(() => {
		switch (variant) {
			case "subscriptionSavings":
				setView(<SubscriptionSavings />);
				break;
			case "gifting":
				setView(<Gifting />);
				break;
			case "perks":
				setView(<Perks />);
				break;
		}
	}, []);

	return <>{view}</>;
}

function SubscriptionSavings() {
	return (
		<div
			className={clsx(
				"relative h-56 w-full max-w-[320px] rounded-lg bg-[#2c7acc] bg-bottom bg-no-repeat px-8 py-7 shadow-[0px_0px_12px] shadow-[#2c7acc]"
			)}
			style={{
				backgroundImage: `url("/img/store/patterns/grid.png")`,
			}}
		>
			<div className="absolute -top-11 -right-10">
				<Image src={"/img/store/money.svg"} key="money" width="123" height="135" />
			</div>
			<div className="grid h-9 w-40 place-items-center rounded-md bg-white/40">
				<h4 className="text-sm font-semibold uppercase">Extra Savings</h4>
			</div>
			<div className="mt-2">
				<p className="mb-2 font-montserrat text-sm font-medium">
					Unlock more savings by purchasing an annual subscription!
				</p>
				<p className="font-inter text-sm text-white/80">
					When purchasing a subscription you are able to save up to 10% by switching to annual subscription
					rather than a monthly subscription.
				</p>
			</div>
		</div>
	);
}

function Gifting() {
	return (
		<div
			className={clsx(
				"relative h-56 w-full max-w-[320px] rounded-lg bg-[#F0AE11] bg-bottom bg-no-repeat px-8 py-7 shadow-[0px_0px_12px] shadow-[#F0AE11]"
			)}
			style={{
				backgroundImage: `url("/img/store/patterns/bumps.png")`,
			}}
		>
			<div className="absolute -top-10 -right-9">
				<Image src={"/img/store/giftbox.svg"} key="giftbox" width="100" height="100" />
			</div>
			<div className="grid h-9 w-40 place-items-center rounded-md bg-black/20">
				<h4 className="text-sm font-semibold uppercase text-black">Gifting Items</h4>
			</div>
			<div className="mt-2">
				<p className="mb-2 font-montserrat text-sm font-medium text-black/70">
					Encourage your friends to start playing Dank Memer with you!
				</p>
				<p className="font-inter text-sm text-black/60">
					Gift any item or subscription from our store to any user on Discord. They don't even need to use
					Dank Memer! You just need their account ID.
				</p>
			</div>
		</div>
	);
}

function Perks() {
	return (
		<div
			className={clsx(
				"relative h-56 w-full max-w-[320px] rounded-lg bg-[#00FFA3] bg-bottom bg-no-repeat px-8 py-7 shadow-[0px_0px_12px] shadow-[#00FFA3]"
			)}
			style={{
				backgroundImage: `url("/img/store/patterns/diamonds.png")`,
			}}
		>
			<div className="absolute -top-6 -right-5">
				<Image src={"/img/store/star.svg"} key="giftbox" width="64" height="64" />
			</div>
			<div className="grid h-9 w-40 place-items-center rounded-md bg-black/20">
				<h4 className="text-sm font-semibold uppercase text-black">Exclusive Perks</h4>
			</div>
			<div className="mt-2">
				<p className="mb-2 font-montserrat text-sm font-medium text-black/70">
					Get the upper-hand over your competition!
				</p>
				<p className="font-inter text-sm text-black/60">
					Get exclusive perks and benefits when you purchase or receive a gift of any subscription tier!
					<br />
					Subscriptions start at $2.00 a month.
				</p>
			</div>
		</div>
	);
}
