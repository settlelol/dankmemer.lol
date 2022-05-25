import { MouseEvent, ReactNode, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";
import clsx from "clsx";

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
}: Props) {
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
			<Head>
				<title>Dank Memer {title.length >= 1 ? `| ${title}` : ""}</title>
			</Head>
			<ToastContainer position="top-center" theme="colored" />
			{rightPaneVisible ? (
				<div
					className={clsx("select-none opacity-50", dragging && "cursor-col-resize select-none")}
					onClick={hideRightPane}
				>
					<div className="pointer-events-none fixed top-0 left-0 h-full w-72 bg-neutral-100 px-9 py-5 dark:bg-dark-100">
						<div
							className="mb-5 flex cursor-pointer items-center justify-start"
							onClick={() => router.push("/")}
						>
							<img src={"/img/memer.png"} width={41} height={41} />
							<h1 className="ml-3 select-none font-montserrat text-2xl font-bold text-dank-200 dark:text-white">
								Dank Memer
							</h1>
						</div>
						{links}
					</div>
					<div className="pointer-events-none my-10 ml-[22rem] mr-16 flex justify-start">
						<div className="relative w-full">{children}</div>
					</div>
				</div>
			) : (
				<>
					<div className="fixed top-0 left-0 h-full w-72 bg-neutral-100 px-9 py-5 dark:bg-dark-100">
						<div
							className="mb-5 flex cursor-pointer items-center justify-start"
							onClick={() => router.push("/")}
						>
							<img src={"/img/memer.png"} width={41} height={41} />
							<h1 className="ml-3 select-none font-montserrat text-2xl font-bold text-dank-200 dark:text-white">
								Dank Memer
							</h1>
						</div>
						{links}
					</div>
					<div
						className={clsx(
							"my-10 ml-[22rem] mr-16 flex justify-start",
							rightPaneVisible && "pointer-events-none"
						)}
					>
						<div className="relative w-full">{children}</div>
					</div>
				</>
			)}
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
