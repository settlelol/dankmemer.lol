import { formatDuration, intervalToDuration } from "date-fns";
import { useState } from "react";

interface Props {
	discount: number;
	expire: number;
}

export function DiscountBanner({ discount, expire }: Props) {
	const getCountdown = () => {
		let duration = intervalToDuration({
			start: new Date(expire),
			end: new Date(),
		});

		return formatDuration(duration, {
			delimiter: ", ",
		});
	};

	const [countdown, setCountdown] = useState(getCountdown());

	setInterval(() => setCountdown(getCountdown()), 1000);

	return (
		<div
			className="relative grid h-full w-full place-items-center rounded-md bg-yellow-300 p-2"
			style={{
				boxShadow: " 0px 0px 20px #ffe61c, inset 0px 0px 20px #ffe100",
			}}
		>
			<div className="z-20 text-center">
				<div
					className="font-montserrat text-3xl font-bold filter"
					style={{
						textShadow:
							"0px 3px 5px rgba(56, 20, 20, 0.42), 0px 0px 10px rgba(0, 0, 0, 0.3)",
					}}
				>
					FLASH SALE!
				</div>
				<div className="font-montserrat text-lg font-bold text-black">
					Sale ends in: {countdown}
				</div>
				<div className="text-l font-montserrat font-bold text-black">
					Pick up your boxes with a <b>{discount}% discount</b> during
					this limited time event!
				</div>
			</div>
			<svg
				id="store-discount-svg"
				height="100%"
				width="100%"
				className="absolute top-0 left-0 z-[1]"
			>
				<circle
					cx="523"
					cy="39"
					r="100.5"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="931.5"
					cy="38.5"
					r="50.5"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="381.5"
					cy="-0.5"
					r="26.5"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="662.7"
					cy="116.8"
					r="39.3"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="1014"
					cy="11"
					r="16"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="720.5"
					cy="0.5"
					r="26.5"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="1221"
					cy="85"
					r="46"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="247"
					cy="98"
					r="13"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
				<circle
					cx="147"
					cy="8"
					r="50"
					style={{
						fill: "#ffe61c",
						filter: "drop-shadow(0px 0px 20px #ffe61c);",
					}}
				/>
			</svg>
		</div>
	);
}
