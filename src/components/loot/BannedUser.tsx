import TextLink from "../ui/TextLink";

export function BannedUser() {
	return (
		<div className="mb-40 flex flex-col items-center space-y-2 text-center text-dark-500 dark:text-white">
			<div className="rounded-md bg-light-500 p-20 dark:bg-dark-500">
				<div className="text-4xl font-bold">Not so fast!</div>
				<div className="flex flex-col items-center space-y-1">
					<div>
						Your account has been banned from purchasing any of our
						lootboxes! If you think this is a mistake, please join{" "}
						<TextLink href="https://discord.gg/dankmemerbot">
							our support server
						</TextLink>{" "}
						for assistance. If this is correct, you may attempt to{" "}
						<TextLink href="/appeals">appeal your ban</TextLink>
					</div>

					<div className="flex items-center space-x-2">
						<TextLink href="/appeals">Go Home</TextLink>
					</div>
				</div>
			</div>
		</div>
	);
}
