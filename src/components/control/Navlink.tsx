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
			<div className="grid place-items-center bg-dank-200 dark:bg-[#175a34] w-10 h-10 rounded-md mr-4 fill-white">
				<Iconify icon={icon} color="white" height={size} />
			</div>
			<p className="text-gray-800 dark:text-white">{text}</p>
		</div>
	);
}
