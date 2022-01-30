import { Icon as Iconify } from "@iconify/react";
import { useRouter } from "next/router";

interface Props {
	icon: string;
	size?: number;
	text: string;
	href: string;
}

export default function Navlink({ icon, size = 22, text, href }: Props) {
	const router = useRouter();

	return (
		<div
			className="group flex items-center mb-3 cursor-pointer transition-colors rounded-md"
			onClick={() => router.push(href)}
		>
			<div className="grid place-items-center bg-[#0FA958]/40 w-10 h-10 rounded-md mr-4 fill-white">
				<Iconify icon={icon} color="white" height={size} />
			</div>
			<p>{text}</p>
		</div>
	);
}
