import axios from "axios";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";
import { Post, UserData } from "../../types";
import { truncate } from "../../util/string";
import { Avatar } from "../Avatar";
import TextLink from "../ui/TextLink";
import Link from "next/link";
import { Label } from "./PostLabel";

interface Props {
	data?: Post;
}

export function PostCard({ data }: Props) {
	const [upvotes, setUpvotes] = useState(data?.upvotes || 0);
	const [upvoted, setUpvoted] = useState(data?.upvoted || false);

	const upvote = async () => {
		axios
			.patch(`/api/community/post/upvote/${data?._id}`)
			.then(({ data }) => {
				setUpvotes(upvotes + data.upvote);
				setUpvoted(data.upvote == 1);
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	return (
		<Link href={data ? `/community/post/${data?._id}` : "#"}>
			<a
				className="flex w-full cursor-pointer space-x-4 rounded-md bg-light-500 p-4 dark:bg-dark-100"
				key={data?._id}
			>
				<div
					className={clsx(
						"flex w-8 cursor-pointer select-none flex-col items-center text-sm",
						upvoted ? "text-dank-300" : "text-light-600 "
					)}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						upvote();
					}}
				>
					<span className="material-icons">arrow_upward</span>
					<div>{upvotes.toLocaleString()}</div>
				</div>
				<div className="relative flex w-full flex-col justify-between space-y-4">
					<div className="flex flex-col space-y-1">
						<div className="font-montserrat font-bold text-black dark:text-white">
							{data?.title ?? (
								<div
									className={clsx(
										"h-5 w-72 animate-pulse rounded bg-gray-400 dark:bg-gray-300"
									)}
								/>
							)}
						</div>
						{data && data.labels?.length > 0 && (
							<div className="flex space-x-2">
								{data.labels.map((label) => (
									<Label label={label} />
								))}
							</div>
						)}
						<div className="break-all leading-5 text-light-600  md:break-words">
							{data ? (
								truncate(data.content, 250)
							) : (
								<div>
									{[...Array(3)].map((_) => (
										<div
											className={clsx(
												"mt-2 h-5 max-w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"
											)}
										/>
									))}
								</div>
							)}
						</div>
					</div>
					<div className="flex items-center justify-between text-light-600">
						<div className="flex items-center space-x-2">
							{data ? (
								<Avatar
									size="20px"
									link={(data.author as UserData).avatar}
									id={(data.author as UserData).id}
								/>
							) : (
								<div className="h-[20px] w-[20px] animate-pulse rounded-full bg-gray-600" />
							)}
							<div className="flex space-x-0 text-sm md:space-x-1">
								<span className="hidden md:inline-block">
									Posted by{" "}
								</span>
								<TextLink
									href={
										data
											? `/@${
													(data?.author as UserData)
														.vanity ||
													(data?.author as UserData)
														.id
											  }`
											: "#"
									}
								>
									{(data?.author as UserData)?.name || "???"}
								</TextLink>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<span
								className="material-icons-outlined"
								style={{ fontSize: "14px" }}
							>
								chat_bubble_outline
							</span>
							<div className="text-sm">
								{data?.comments.toLocaleString() ?? 0}
							</div>
						</div>
					</div>
				</div>
			</a>
		</Link>
	);
}
