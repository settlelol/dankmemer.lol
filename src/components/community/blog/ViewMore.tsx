import Link from "next/link";
import { Icon } from "../../Icon";

export function ViewMore() {
	return (
		<Link href="/community/blogs">
			<div className="flex h-full w-full cursor-pointer items-center justify-center rounded-md border-4 border-light-500 dark:border-dark-100">
				<div className="p-2 font-bold text-light-600">
					<div>
						View more
						<br />
						blog posts
					</div>
					<div className="text-center">
						<Icon id="keyboard_arrow_right" />
					</div>
				</div>
			</div>
		</Link>
	);
}
