import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../components/ui/Button";
import Container from "../components/ui/Container";
import { APPEALS } from "../constants";
import { PageProps } from "../types";
import { unauthenticatedRoute } from "../util/redirects";
import { withSession } from "../util/session";

export default function Appeals({ user }: PageProps) {
	const [type, setType] = useState("Bot Ban");
	const [brokenRules, setBrokenRules] = useState<number[]>([]);
	const [appeal, setAppeal] = useState("");

	const updateBrokenRules = (index: number) => {
		if (brokenRules.includes(index)) {
			setBrokenRules(brokenRules.filter((i) => i != index));
		} else if (!brokenRules.includes(index)) {
			setBrokenRules((oldBrokenRulesState) => [
				...oldBrokenRulesState,
				index,
			]);
		}
	};

	const submit = async () => {
		const res = await fetch("/api/appeal", {
			credentials: "same-origin",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				appeal,
				rules: brokenRules.map(
					(i) =>
						APPEALS[type.includes("Bot") ? "user" : "server"][i - 1]
				),
				type,
			}),
		});

		if (res.status !== 200) {
			toast.dark((await res.json()).error);
			return;
		}

		setBrokenRules([]);
		setAppeal("");
		toast.dark("Your appeal has been submitted.");
	};

	useEffect(() => {
		setBrokenRules([]);
	}, [type]);

	return (
		<Container title="Appeal" user={user}>
			<div className="relative my-16 flex justify-center">
				<div className="flex max-w-3xl flex-col rounded-md bg-gray-200 dark:bg-dark-200">
					<div className="border-b-8 border-gray-300 p-8 text-center dark:border-dark-100">
						<div className="font-montserrat text-3xl font-bold text-dark-500 dark:text-white">
							Appeal{" "}
							{
								{
									"Bot Ban": "a permanent bot ban",
									"Bot Blacklist": "a temporary bot ban",
									"Community Server Ban":
										"a community server ban",
									"Support Server Ban":
										"a support server ban",
								}[type]
							}
						</div>
						<div className="max-w-2xl text-gray-500 dark:text-gray-400">
							Please provide as much detail as possible when
							submitting your appeal. Appealing does not guarantee
							a reprieval of the punishment.
						</div>
					</div>
					<div className="flex flex-col space-y-2 p-4">
						<div className="font-montserrat text-lg font-bold text-dark-400 dark:text-white">
							Which rules were you punished for?
						</div>
						<div>
							{[
								"Bot Ban",
								"Bot Blacklist",
								"Community Server Ban",
								"Support Server Ban",
							].map((stype) => (
								<label
									key={stype}
									htmlFor={"type-" + stype}
									onClick={() => setType(stype)}
									className="flex select-none items-center space-x-6 text-dark-500 dark:text-white"
								>
									<span
										className={clsx(
											"absolute h-4 w-4 rounded-full",
											stype === type
												? "bg-dank-300"
												: "bg-gray-400 dark:bg-dank-400"
										)}
									/>
									<span>{stype}</span>
								</label>
							))}
						</div>
					</div>
					{type == "Bot Blacklist" && (
						<div className="px-4 text-rose-600">
							If a blacklist duration is under two weeks, it will
							not be appealed.
						</div>
					)}
					{type == "Community Server Ban" && (
						<div className="px-4 text-rose-600">
							If you are still in the server but cannot talk, you
							are not banned. You are timed out. This cannot be
							appealed as it is temporary.
						</div>
					)}
					{type == "Bot Ban" && (
						<div className="px-4 text-yellow-300">
							If your ban is temporary, that is a blacklist and
							not a ban.
						</div>
					)}
					<div className="flex flex-col space-y-2 p-4">
						<div className="flex flex-col space-y-2">
							<div className="font-montserrat text-lg font-bold text-dark-500 dark:text-white">
								Which rules did you break?
							</div>
							<div className="flex flex-col space-y-1">
								{APPEALS[
									type.includes("Bot") ? "user" : "server"
								].map((rule, i) => (
									<label
										key={i + 1}
										htmlFor={"rule-" + (i + 1)}
										onClick={(e) =>
											updateBrokenRules(i + 1)
										}
										className="flex select-none items-center space-x-6 text-dark-400 dark:text-white"
									>
										<span
											className={clsx(
												"absolute flex h-5 w-5 items-center justify-center rounded-md text-sm text-white",
												brokenRules.includes(i + 1)
													? "bg-dank-300"
													: "bg-gray-500 dark:bg-dank-400"
											)}
										>
											{i + 1}
										</span>
										<span>{rule}</span>
									</label>
								))}
							</div>
						</div>
					</div>

					<div className="flex flex-col space-y-2 p-4">
						<div className="flex flex-col space-y-2">
							<div className="font-montserrat text-lg font-bold text-dark-500 dark:text-white">
								Please write your appeal below.
							</div>
							<textarea
								className="h-48 w-full overflow-hidden rounded-md bg-light-500 px-2 py-1 text-sm text-black placeholder-gray-500 outline-none dark:bg-dank-500 dark:text-light-300"
								maxLength={2000}
								onChange={(e) => setAppeal(e.target.value)}
								value={appeal}
								placeholder={""}
							/>
						</div>
					</div>

					<div className="flex justify-end p-4">
						<Button
							variant="dark"
							disabled={
								!(
									brokenRules.length >= 1 &&
									appeal.length >= 20 &&
									appeal.length <= 2000
								)
							}
							onClick={() => submit()}
						>
							Submit
						</Button>
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps =
	withSession(unauthenticatedRoute);
