import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";

interface Props {
	userId: string;
}

export default function CancelSubscription({ userId }: Props) {
	const router = useRouter();
	const [errored, setErrored] = useState(false);

	const sendCancellation = async () => {
		try {
			await axios(`/api/customers/${userId}/subscription/cancel`);
			router.reload();
		} catch {
			setErrored(true);
			setTimeout(() => {
				setErrored(false);
			}, 5_000);
		}
	};

	return (
		<>
			<Title size="medium" className="font-semibold">
				Confirm cancellation
			</Title>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				Are you sure you want to cancel your subscription? This action is irreversible.
			</p>
			<div className="mt-5 flex w-full items-center justify-end space-x-4">
				<Button
					size="medium"
					variant="danger"
					onClick={(e) => {
						e.preventDefault();
						sendCancellation();
					}}
				>
					Cancel subscription
				</Button>
			</div>
			{errored && (
				<p className="mt-2 text-right text-sm text-red-500">Something went wrong. Please try again later.</p>
			)}
		</>
	);
}
