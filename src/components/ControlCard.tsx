import axios from "axios";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";
import Button from "./ui/Button";
import Dropdown from "./ui/Dropdown";

const types = {
	normal: "border-8 border-dank-300 bg-dank-200",
	destructive: "border-8 border-red-600 bg-red-500",
};

interface Props {
	icon: string;
	label: string;
	type: keyof typeof types;
	input?: {
		icon: string;
		placeholder: string;
	};
	alloweEmptyInput?: boolean;
	dropdown?: {
		icon: string;
		initial: string;
		options: {
			text: string;
			value: string;
		}[];
	};
	endpoint: string;
	finish?: (data: any) => void;
}

export function ControlCard({
	icon,
	label,
	type,
	input,
	alloweEmptyInput = false,
	dropdown,
	endpoint,
	finish,
}: Props) {
	const [inputData, setInputData] = useState("");
	const [dropdownData, setDropdownData] = useState<string | null>();
	const [processing, setProcessing] = useState(false);

	return (
		<div className="flex h-80 w-80 flex-col items-start justify-between rounded-md bg-light-500 p-8 dark:bg-dark-500">
			<div className="flex flex-col space-y-4">
				<div className="flex items-center justify-between space-x-4">
					<div
						className={clsx(
							"flex items-center justify-center rounded-full p-4",
							types[type]
						)}
					>
						<span className="material-icons">{icon}</span>
					</div>
					<div className="font-montserrat text-xl font-bold text-dark-500 dark:text-white">
						{label}
					</div>
				</div>
				<div className="space-y-4">
					{input && (
						<div className="flex h-10 w-full items-center space-x-2 rounded-md bg-gray-100 px-3 py-3 text-sm text-black placeholder-gray-500 dark:bg-dank-500 dark:text-light-300">
							<span className="material-icons text-gray-500">
								{input.icon}
							</span>
							<textarea
								className="h-full resize-none overflow-hidden bg-transparent outline-none"
								onChange={(e) => setInputData(e.target.value)}
								value={inputData}
								placeholder={input.placeholder}
							/>
						</div>
					)}
					{dropdown && (
						<Dropdown
							content={
								<div className="flex w-full items-center justify-between p-2">
									<div className="flex items-center space-x-2">
										<span className="material-icons text-dark-500 dark:text-gray-500">
											{dropdown.icon}
										</span>
										<div className="text-dark-500 dark:text-gray-500">
											{dropdown.options.find(
												(o) => o.value === dropdownData
											)?.text || dropdown.initial}
										</div>
									</div>

									<div className="material-icons text-dark-100 dark:text-gray-500">
										expand_more
									</div>
								</div>
							}
							options={dropdown.options.map((option) => ({
								onClick: (e) => {
									setDropdownData(option.value);
								},
								label: option.text,
							}))}
						/>
					)}
				</div>
			</div>
			<Button
				disabled={
					processing ||
					(input && inputData.length === 0 && !alloweEmptyInput) ||
					(dropdown && (!dropdownData || dropdownData?.length == 0))
				}
				size="medium"
				variant="primary"
				onClick={async () => {
					setProcessing(true);
					const postEndpoint = endpoint
						.replace("{{input}}", inputData)
						.replace("{{dropdown}}", dropdownData || "");
					await axios(postEndpoint)
						.then((data) => {
							if (data.status !== 200) {
								toast.dark(data.data.error);
							}
							if (finish) {
								finish(data);
							}
							setDropdownData(null);
							setInputData("");
							setProcessing(false);
						})
						.catch((e) => {
							setProcessing(false);
							console.error(e);
							toast.dark(e.response.statusText);
						});
				}}
			>
				Confirm
			</Button>
		</div>
	);
}
