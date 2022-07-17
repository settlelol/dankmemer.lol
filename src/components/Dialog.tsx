import clsx from "clsx";
import { Dispatch, ReactNode, SetStateAction, useEffect, useRef } from "react";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	open: boolean;
	onClose: Dispatch<SetStateAction<boolean>>;
	closeButton?: boolean;
	children: ReactNode;
}

export default function Dialog({ open, onClose, children, closeButton }: Props) {
	const dialog = useRef<any>(null);
	const state = useRef(false);

	const closeDialog = () => {
		onClose(false);
		state.current = false;
	};

	const dismissDialog = ({ target }: MouseEvent) => {
		// @ts-expect-error
		if (target && target.nodeName === "DIALOG") {
			dialog.current?.close("dismiss");
		}
	};

	useEffect(() => {
		if (dialog.current) {
			dialog.current.addEventListener("close", closeDialog);
			dialog.current.addEventListener("click", dismissDialog);
		}
	}, [dialog]);

	useEffect(() => {
		if (dialog.current && open && !state.current) {
			dialog.current.showModal();
			state.current = true;
		}
	}, [open]);

	return (
		<dialog
			ref={dialog}
			className={clsx(
				"relative m-auto overflow-hidden",
				"backdrop:bg-dark-400/50 backdrop:backdrop-blur-sm",
				"bg-white dark:bg-dark-300",
				"rounded-md shadow-xl transition-all",
				"sm:w-full sm:max-w-lg"
			)}
		>
			<form className="p-4 pr-5">
				{closeButton && (
					<span
						className="absolute top-2 right-2 cursor-pointer opacity-50 hover:opacity-75"
						onClick={() => dialog.current!.close()}
					>
						<Iconify icon="clarity:close-line" />
					</span>
				)}
				{!children ? <p>You need to provide child elements</p> : children}
			</form>
		</dialog>
	);
}
