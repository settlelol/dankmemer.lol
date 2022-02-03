import { useRouter } from "next/router";
import { useState } from "react";
import Button from "../ui/Button";
import TextLink from "../ui/TextLink";

interface Props {
	checkAge: () => void;
}

export function AgeCheck({ checkAge }: Props) {
	const [date, setDate] = useState("");
	const router = useRouter();

	const verifyAge = () => {
		if (
			parseFloat(
				(
					Math.round(
						(new Date().getTime() - new Date(date).getTime()) /
							1000 /
							(60 * 60 * 24)
					) / 365.25
				).toFixed()
			) >= 21
		) {
			return checkAge();
		} else {
			router.push("/");
		}
	};

	return (
		<div className="mb-40 flex flex-col items-center space-y-2 text-center text-dark-500 dark:text-white">
			<div className="rounded-md bg-light-500 p-20 dark:bg-dark-500">
				<div className="text-5xl font-bold">Hold on!</div>
				<div className="flex flex-col items-center space-y-4">
					<div>
						Before you go any further, we need to verify you are of
						legal age to access the following page.
					</div>
					<div>
						<textarea
							className="h-7 w-48 resize-none overflow-hidden rounded-md bg-gray-100 px-2 py-1 text-sm text-black placeholder-gray-500 outline-none dark:bg-dank-500 dark:text-light-300"
							maxLength={10}
							onChange={(e) => setDate(e.target.value)}
							value={date}
							placeholder={"YYYY-MM-DD"}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Button
							size="medium"
							variant="primary"
							disabled={date.length !== 10}
							onClick={() => verifyAge()}
						>
							Verify
						</Button>
						<TextLink href="/">Go Home</TextLink>
					</div>
				</div>
			</div>
		</div>
	);
}
