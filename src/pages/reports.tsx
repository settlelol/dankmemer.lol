import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../components/ui/Button";
import Container from "../components/ui/Container";
import { REPORTS } from "../constants";
import { PageProps } from "../types";
import { unauthenticatedRoute } from "../util/redirects";
import { withSession } from "../util/session";

export default function Reports({ user }: PageProps) {
	const [type, setType] = useState("user");
	const [id, setId] = useState("");
	const [brokenRules, setBrokenRules] = useState<number[]>([]);
	const [report, setReport] = useState("");

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
		const res = await fetch("/api/report", {
			credentials: "same-origin",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id,
				report,
				rules: brokenRules.map((i) => REPORTS[type][i - 1]),
				type,
			}),
		});

		if (res.status !== 200) {
			toast.dark((await res.json()).error);
			return;
		}

		setId("");
		setBrokenRules([]);
		setReport("");
		toast.dark("Your report has been submitted.");
	};

	useEffect(() => {
		setBrokenRules([]);
	}, [type]);

	return (
		<Container title="Reports" user={user}>
			<div className="relative my-16 flex justify-center">
				<div className="flex max-w-3xl flex-col rounded-md bg-gray-200 dark:bg-dark-200">
					<div className="border-b-8 border-gray-300 p-8 text-center dark:border-dark-100">
						<div className="font-montserrat text-3xl font-bold text-dark-500 dark:text-white">
							Report a {type}
						</div>
						<div className="max-w-2xl text-gray-500 dark:text-gray-400">
							Please provide as much detail as possible when
							submitting your report. We are unable to provide
							details on the punishment from this report.
						</div>
					</div>
					<div className="flex flex-col space-y-2 p-4">
						<div className="flex flex-col space-y-2">
							<div className="font-montserrat text-lg font-bold text-dark-500 dark:text-white">
								What type of report is this?
							</div>
							<div>
								{["User report", "Server report"].map(
									(stype) => (
										<label
											key={stype}
											htmlFor={"type-" + stype}
											onClick={() =>
												setType(
													stype === "User report"
														? "user"
														: "server"
												)
											}
											className="flex select-none items-center space-x-6 text-dark-500 dark:text-white"
										>
											<span
												className={clsx(
													"absolute h-4 w-4 rounded-full",
													stype
														.toLowerCase()
														.includes(type)
														? "bg-dank-300"
														: "bg-gray-400 dark:bg-dank-400"
												)}
											/>
											<span>{stype}</span>
										</label>
									)
								)}
							</div>
							<div className="flex flex-col-reverse items-start space-x-0 sm:flex-row sm:items-center sm:space-x-2">
								<textarea
									className="h-8 w-48 resize-none overflow-hidden rounded-md bg-gray-100 px-2 py-1 text-sm text-black placeholder-gray-500 outline-none dark:bg-dank-500 dark:text-light-300"
									maxLength={22}
									onChange={(e) => setId(e.target.value)}
									value={id}
									placeholder={""}
								/>
								<div className="text-dark-500 dark:text-white">
									ID of {type} you are reporting.
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col space-y-2 p-4">
						<div className="flex flex-col space-y-2">
							<div className="font-montserrat text-lg font-bold text-dark-500 dark:text-white">
								Which rules did they break?
							</div>
							<div className="flex flex-col space-y-1">
								{REPORTS[type].map((rule, i) => (
									<label
										key={i + 1}
										htmlFor={"rule-" + i + 1}
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
								Please write your report below.
							</div>
							<textarea
								className="h-48 w-full overflow-hidden rounded-md bg-light-500 px-2 py-1 text-sm text-black placeholder-gray-500 outline-none dark:bg-dank-500 dark:text-light-300"
								maxLength={2000}
								onChange={(e) => setReport(e.target.value)}
								value={report}
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
									report.length >= 20 &&
									report.length <= 2000 &&
									id.length >= 1 &&
									id.length <= 22
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
