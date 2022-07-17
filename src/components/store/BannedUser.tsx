import TextLink from "../ui/TextLink";
import clsx from "clsx";
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef } from "react";
import { Icon as Iconify } from "@iconify/react";
import Button from "../ui/Button";
import { useRouter } from "next/router";

export default function BannedUser() {
	const dialog = useRef<any>(null);
	const router = useRouter();

	useEffect(() => {
		if (dialog.current && !dialog.current.open) {
			dialog.current.showModal();
		}
	}, []);

	return (
		<dialog
			ref={dialog}
			className={clsx(
				"relative m-auto overflow-hidden",
				"backdrop:bg-white backdrop:backdrop-blur-sm dark:backdrop:bg-dark-400",
				"bg-white dark:bg-dark-400",
				"w-full max-w-2xl"
			)}
		>
			<form className="p-4 pr-5">
				<h1 className="font-montserrat text-4xl font-bold">Uh oh..</h1>
				<div className="flex flex-col space-y-1">
					<p>
						Your account has been banned from purchasing anything from our store! If you think this is a
						mistake, please join{" "}
						<TextLink href="https://discord.gg/dankmemerbot">our support server</TextLink> for assistance.
						If this is correct, you may attempt to <TextLink href="/appeals">appeal your ban</TextLink>.
					</p>
					<Button onClick={() => router.push("/")} size="medium" className="max-w-max">
						Go home
					</Button>
				</div>
			</form>
		</dialog>
	);
}
