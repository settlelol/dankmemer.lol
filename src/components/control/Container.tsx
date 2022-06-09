import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { NextRouter, useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import clsx from "clsx";
import { NextSeo } from "next-seo";
import { RequireAllOrNone } from "type-fest";

interface Props {
	children: ReactNode;
	links: ReactNode;
	title: string;
	hideRightPane?: () => void;
	rightPaneVisible?: boolean;
	rightPaneContent?: ReactNode;
}

export default function ControlPanelContainer({
	children,
	links,
	title,
	hideRightPane,
	rightPaneVisible,
	rightPaneContent,
}: RequireAllOrNone<Props, "hideRightPane" | "rightPaneContent" | "rightPaneVisible">) {
	const router = useRouter();

	const rightPane = useRef<HTMLDivElement>(null);
	const draggingStartPos = useRef(0);

	const [dragging, setDragging] = useState(false);
	const [draggedWidth, setDraggedWidth] = useState(rightPane.current?.getBoundingClientRect().width ?? 550);

	function draggerMouseDown(e: MouseEvent<HTMLDivElement>) {
		setDragging(true);
		draggingStartPos.current = e.clientX;
		document.addEventListener("mousemove", draggerMouseMove);
		document.addEventListener("mouseup", draggerMouseUp);
	}

	function draggerMouseUp() {
		document.removeEventListener("mousemove", draggerMouseMove);
		document.removeEventListener("mouseup", draggerMouseUp);
		setDragging(false);
	}

	function draggerMouseMove(event: Event) {
		const clientX = (event as unknown as MouseEvent).clientX;
		const additionalWidth = draggingStartPos.current - clientX;
		setDraggedWidth(rightPane.current!.getBoundingClientRect().width + additionalWidth);
		draggingStartPos.current = clientX;
	}

	return (
		<>
			{title && <NextSeo title={`Dank Memer | ${title}`} />}
			<ToastContainer position="top-center" theme="colored" />
			<div
				className={clsx(
					rightPaneVisible && "select-none opacity-50",
					rightPaneVisible && dragging && "cursor-col-resize select-none"
				)}
				{...(rightPaneVisible && { onClick: hideRightPane })}
			>
				<div
					className={clsx(
						rightPaneVisible && "pointer-events-none",
						"fixed top-0 left-0 h-full w-20 bg-neutral-100 px-4 py-5 dark:bg-dark-100 xl:w-72 xl:px-9"
					)}
				>
					<div
						className="mb-5 grid cursor-pointer place-items-center xl:flex xl:items-center xl:justify-start"
						onClick={() => router.push("/")}
					>
						<img src={"/img/memer.png"} width={41} height={41} />
						<h1 className="ml-3 hidden select-none font-montserrat text-2xl font-bold text-dank-200 dark:text-white xl:block">
							Dank Memer
						</h1>
					</div>
					{links}
				</div>
				<div
					className={clsx(
						rightPaneVisible && "pointer-events-none",
						"ml-32 mr-16 xl:ml-[22rem] xl:mr-16",
						"flex min-h-screen justify-start"
					)}
				>
					<div className="relative my-10 w-full">{children}</div>
				</div>
			</div>
			<div
				ref={rightPane}
				style={{ width: draggedWidth }}
				className={clsx(
					"fixed top-0 right-0 h-full min-w-[550px] max-w-5xl overflow-auto bg-neutral-100 px-8 pt-10 transition-transform duration-300 dark:bg-dark-100",
					rightPaneVisible ? "translate-x-0" : "translate-x-full",
					dragging && "pointer-events-none cursor-col-resize"
				)}
			>
				<div
					id="dragger"
					className="absolute left-0 top-0 grid h-full w-2 cursor-col-resize select-none place-items-center pl-1"
					onMouseDown={draggerMouseDown}
				>
					<span className="text-[10px] text-black opacity-20 dark:text-white">||</span>
				</div>
				{rightPaneVisible && rightPaneContent}
			</div>
		</>
	);
}
