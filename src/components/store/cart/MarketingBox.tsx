import Money from "/public/img/other/Money.svg";
import Grid from "/public/img/other/Grid.png";
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
				"relative px-8 py-7 w-80 h-56 shadow-[0px_0px_12px] rounded-lg",
				boxColors[color]
			)}
			style={{
				backgroundImage: `url("${Grid.src}")`,
			}}
		>
			<Money className="absolute top-[-45px] right-[-40px]" />
			<div className="grid place-items-center bg-white/40 w-40 h-9 rounded-md">
				<h4 className="font-medium uppercase text-sm">{title}</h4>
			</div>
			<div className="mt-2">
				<p className="font-medium font-montserrat text-sm mb-2">
					{topText}
				</p>
				<p className="font-inter text-sm text-white/80">{bottomText}</p>
			</div>
		</div>
	);
}
