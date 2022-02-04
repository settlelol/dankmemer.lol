import Money from "/public/img/store/Money.svg";
import Grid from "/public/img/store/Grid.png";
import clsx from "clsx";

interface Props {
	color: keyof typeof boxColors;
	title: string;
	topText: string;
	bottomText: string;
}

const boxColors = {
	blue: "bg-[#32c3e4] shadow-[#32c3e4]",
	green: "bg-[#0FA958] shadow-[#0FA958]",
};

export default function MarketingBox({
	color,
	title,
	topText,
	bottomText,
}: Props) {
	return (
		<div
			className={clsx(
				"relative h-56 w-full rounded-lg px-8 py-7 shadow-[0px_0px_12px]",
				boxColors[color]
			)}
			style={{
				backgroundImage: `url("${Grid.src}")`,
			}}
		>
			<Money className="absolute top-[-45px] right-[-40px]" />
			<div className="grid h-9 w-40 place-items-center rounded-md bg-white/40">
				<h4 className="text-sm font-medium uppercase">{title}</h4>
			</div>
			<div className="mt-2">
				<p className="mb-2 font-montserrat text-sm font-medium">
					{topText}
				</p>
				<p className="font-inter text-sm text-white/80">{bottomText}</p>
			</div>
		</div>
	);
}
