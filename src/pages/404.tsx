import { useRouter } from "next/router";
import Button from "../components/ui/Button";
import { PageProps } from "../types";

export default function Error({}: PageProps) {
	const router = useRouter();

	return (
		<div className="flex h-screen w-full items-center justify-center text-center">
			<div className="flex flex-col space-y-2">
				<div className="font-montserrat text-6xl font-bold text-dank-300">
					Uh Oh
				</div>
				<div className="font-montserrat font-bold text-dark-500 dark:text-white">
					We can't seem to find the page that you were looking for.
				</div>
				<Button
					size="medium"
					variant="primary"
					onClick={() => router.push("/")}
				>
					Go Home
				</Button>
			</div>
		</div>
	);
}
