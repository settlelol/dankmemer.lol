import { Post, UserData } from "../../../types";
import Link from "next/link";
import { Avatar } from "../../Avatar";
import { sanitizeCategory } from "../../../util/community";
import { format, formatDistance } from "date-fns";
import Tooltip from "../../ui/Tooltip";

interface AuthorProps {
	post: Post;
}

export default function AuthorInfo({ post }: AuthorProps) {
	return (
		<div className="flex cursor-pointer flex-col space-x-0 text-light-600 md:flex-row md:items-center md:space-x-1">
			<div className="flex space-x-1">
				<span>by</span>
				<Link
					href={`/@${
						(post.author as UserData).vanity ||
						(post.author as UserData).id
					}`}
				>
					<a className="flex items-center space-x-1">
						<Avatar
							id={(post.author as UserData).id}
							link={(post.author as UserData).avatar}
							size="16px"
						/>
						<a className="hover:text-dark-100 hover:underline dark:hover:text-light-400">
							{(post.author as UserData).name}#
							{(post.author as UserData).discriminator}
						</a>
					</a>
				</Link>
			</div>
			<div className="flex space-x-1">
				<span>in</span>
				<Link href={`/community/posts?category=${post.category}`}>
					<a className="hover:text-dark-100 hover:underline dark:hover:text-light-400">
						{sanitizeCategory(post.category)}
					</a>
				</Link>
				,{" "}
			</div>
			<Tooltip content={format(post.createdAt, "MMMM dd, yyyy")}>
				<span className="cursor-default">
					{formatDistance(new Date(post.createdAt), new Date(), {
						addSuffix: true,
					})}
				</span>
			</Tooltip>
		</div>
	);
}
