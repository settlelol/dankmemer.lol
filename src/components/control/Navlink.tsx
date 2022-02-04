import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
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
			className="group mb-3 flex cursor-pointer items-center rounded-md transition-colors"
			onClick={() => router.push(href)}
		>
			<div className="mr-4 grid h-10 w-10 place-items-center rounded-md bg-dank-200 fill-white dark:bg-[#175a34]">
				<Iconify icon={icon} color="white" height={size} />
			</div>
			<p
				className={clsx(
					router.route === href
						? "text-dank-200"
						: "text-gray-800 group-hover:text-dank-100 dark:text-white"
				)}
			>
				{text}
			</p>
		</div>
	);
}
