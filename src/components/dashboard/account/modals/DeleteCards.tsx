import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";

interface Props {
	userId: string;
	cardIds: string[];
}

export default function DeleteSelectedCards({ userId, cardIds }: Props) {
	const router = useRouter();
	const [error, setError] = useState<string | null>();

	const deleteSelectedCards = async () => {
		try {
			await axios({
				url: `/api/customers/${userId}/cards/delete`,
				method: "POST",
				data: {
					ids: cardIds,
				},
			});
			router.reload();
		} catch {
			setError("Failed to remove card(s) from your account. Please try again later");
		}
	};

	return (
		<>
			<Title size="medium" className="font-semibold">
				Confirm deletion
			</Title>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				Are you sure you want to remove <span className="underline">all</span> of the selected cards that are
				attached to your account? This action is irreversible.
			</p>
			<div className="mt-5 flex w-full items-center justify-end space-x-4">
				<Button
					size="medium"
					variant="danger"
					onClick={(e) => {
						e.preventDefault();
						deleteSelectedCards();
					}}
				>
					Delete selected
				</Button>
			</div>
			{error && (
				<p className="mt-2 text-right text-sm text-red-500">
					{error !== null ? error : "Something went wrong. Please try again later."}
				</p>
			)}
		</>
	);
}
