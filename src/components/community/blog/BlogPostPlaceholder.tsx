import clsx from "clsx";
import Button from "../../ui/Button";

export function BlogPostPlaceholder() {
	return (
		<div
			className={clsx(
				"w-full rounded-md bg-light-500 p-4 dark:bg-dark-100",
				"sm:h-52 lg:h-72"
			)}
		>
			<div className="flex h-full flex-col justify-between space-y-4">
				<div className="flex flex-col space-y-4">
					<div className="flex flex-col space-y-1">
						{[...Array(3)].map(() => (
							<div
								className={clsx(
									"h-3 w-full animate-pulse rounded bg-gray-500 dark:bg-gray-400"
								)}
							/>
						))}
					</div>
					<div className="flex flex-col space-y-1">
						{[...Array(4)].map(() => (
							<div
								className={clsx(
									"h-3 w-full animate-pulse rounded bg-gray-400 dark:bg-gray-300"
								)}
							/>
						))}
					</div>
				</div>
				<div className="flex flex-col space-y-2">
					<Button variant="dark" disabled block>
						Continue Reading
					</Button>
				</div>
			</div>
		</div>
	);
}
