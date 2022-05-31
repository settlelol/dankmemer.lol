import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { useRouter } from "next/router";

interface Props {
	currentPage: "cart" | "checkout" | "success";
}

export default function StoreBreadcrumb({ currentPage }: Props) {
	const router = useRouter();

	return (
		<div className="mb-3 flex select-none items-center justify-start overflow-x-auto text-neutral-600 dark:text-neutral-300">
			<p
				className="flex cursor-pointer items-center justify-start transition-colors hover:dark:text-white"
				onClick={() => router.push("/store")}
			>
				<Iconify icon="bx:bxs-store" color="currentColor" />
				<span className="ml-2">Home</span>
			</p>
			<p className="mx-2 mt-0.5">
				<Iconify icon="ic:sharp-chevron-right" height={20} />
			</p>
			{currentPage === "cart" ? (
				<p className="flex w-full items-center justify-start text-dank-300 dark:text-dank-100">
					<Iconify icon="akar-icons:cart" color="currentColor" height={20} />
					<span className="ml-2">Shopping cart</span>
				</p>
			) : currentPage === "checkout" ? (
				<>
					<p
						className="flex min-w-max cursor-pointer items-center justify-start transition-colors hover:dark:text-white"
						onClick={() => router.push("/store/cart")}
					>
						<Iconify icon="akar-icons:cart" color="currentColor" height={20} />
						<span className="ml-2">Shopping cart</span>
					</p>
					<p className="mx-2 mt-0.5">
						<Iconify icon="ic:sharp-chevron-right" height={20} />
					</p>
					<p className="flex items-center justify-start text-dank-100">
						<Iconify icon="fluent:payment-16-filled" color="currentColor" height={20} />
						<span className="ml-2">Checkout</span>
					</p>
				</>
			) : (
				""
			)}
		</div>
	);
}
