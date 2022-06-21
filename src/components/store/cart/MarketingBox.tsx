import clsx from "clsx";
import Image from "next/image";

interface Props {
	color: keyof typeof boxColors;
	title: string;
	topText: string;
	bottomText: string;
}

const boxColors = {
	blue: "bg-[#2c7acc] shadow-[#2c7acc]",
	green: "bg-[#0FA958] shadow-[#0FA958]",
};

export default function MarketingBox({ color, title, topText, bottomText }: Props) {
	return (
		<div
			className={clsx("relative h-56 w-full rounded-lg px-8 py-7 shadow-[0px_0px_12px]", boxColors[color])}
			style={{
				backgroundImage: `url("/img/store/patterns/grid.png")`,
			}}
		>
			<div className="absolute -top-11 -right-10">
				<Image src={"/img/store/money.svg"} key="money" width="123" height="135" />
			</div>
			<div className="grid h-9 w-40 place-items-center rounded-md bg-white/40">
				<h4 className="text-sm font-medium uppercase">{title}</h4>
			</div>
			<div className="mt-2">
				<p className="mb-2 font-montserrat text-sm font-medium">{topText}</p>
				<p className="font-inter text-sm text-white/80">{bottomText}</p>
			</div>
		</div>
	);
}
