import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";

interface Props {
	userId: string;
}

export default function AdjustSubscription({ userId }: Props) {
	const router = useRouter();
	const [errored, setErrored] = useState(false);

	return (
		<>
			<Title size="medium" className="font-semibold">
				Change your Subscription
			</Title>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				Adjust which subscription tier you are currently subscribed to or change your current billing period
				interval.
			</p>
			<section className="my-5">
				<Title size="small" className="font-semibold">
					Subscription tier
				</Title>
			</section>
			<div className="mt-5 flex w-full items-center justify-end space-x-4">
				<Button
					size="medium"
					variant="primary"
					onClick={(e) => {
						e.preventDefault();
						sendCancellation();
					}}
				>
					Save changes
				</Button>
			</div>
			{errored && (
				<p className="mt-2 text-right text-sm text-red-500">Something went wrong. Please try again later.</p>
			)}
		</>
	);
}
