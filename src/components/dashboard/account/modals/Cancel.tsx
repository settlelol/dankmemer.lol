import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";

export default function CancelSubscription() {
	return (
		<>
			<Title size="medium" className="font-semibold">
				Confirm cancellation
			</Title>
			<p className="text-sm text-neutral-500 dark:text-neutral-400">
				Are you sure you want to cancel your subscription? This action is irreversible.
			</p>
			<div className="mt-5 flex w-full items-center justify-end space-x-4">
				<Button size="medium" variant="danger">
					Cancel subscription
				</Button>
			</div>
		</>
	);
}
