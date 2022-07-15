import axios from "axios";
import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "./ui/Button";
import Dropdown from "./ui/Dropdown";
import { Icon as Iconify } from "@iconify/react";
import Input from "./store/Input";

const types = {
	normal: "border-8 border-dank-300 bg-dank-200",
	destructive: "border-8 border-red-600 bg-red-500",
};

interface Props {
	icon: string;
	title: string;
	type: keyof typeof types;
	input?: {
		label: string;
		placeholder: string;
		icon: string;
		value: string;
		type: "text" | "number";
		required?: boolean;
	};
	dropdown?: {
		icon: string;
		initial: string;
		options: {
			text: string;
			value: string;
		}[];
	};
	allowEmptyInput?: boolean;
	endpoint: string;
	finish?: (data: any) => void;
}

export function ControlCard({ icon, title, type, input, allowEmptyInput = false, dropdown, endpoint, finish }: Props) {
	const [inputData, setInputData] = useState("");
	const [dropdownData, setDropdownData] = useState<string | null>();
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		setInputData(input?.value ?? "");
	}, [input?.value]);

	return (
		<div className="flex h-72 w-80 flex-col items-start justify-between rounded-lg bg-light-500 px-4 py-6 dark:bg-dark-200">
			<div className="flex w-full flex-col space-y-4">
				<div className="flex items-center justify-start space-x-4">
					<div
						className={clsx(
							"flex items-center justify-center rounded-full p-3",
							type === "normal" ? "bg-dank-300/10" : "bg-red-500/10"
						)}
					>
						<Iconify
							icon={icon}
							width={24}
							className={type === "normal" ? "text-dank-300" : "text-red-500"}
						/>
					</div>
					<h4 className="font-montserrat text-xl font-semibold text-neutral-700 dark:text-neutral-100">
						{title}
					</h4>
				</div>
				<div className="space-y-4">
					{input && (
						<Input
							type="text"
							width="w-full"
							label={input.label}
							placeholder={input.placeholder}
							icon={input.icon}
							iconSize={16}
							iconGap={"4"}
							value={inputData}
							className="pl-9"
							onChange={(e: any) => {
								input.type === "number"
									? !e.target.value.match(/(^[0-9]+$|^$)/) || e.target.value.length >= 21
										? e.preventDefault()
										: setInputData(e.target.value)
									: setInputData(e.target.value);
							}}
							{...(input.required && { required: input.required })}
						/>
					)}
					{dropdown && (
						<Dropdown
							content={
								<div
									className={clsx(
										"flex w-full items-center justify-between rounded-md",
										dropdown.options.find((o) => o.value === dropdownData)?.text
											? "text-black dark:text-neutral-100"
											: "text-neutral-500 dark:text-neutral-400",
										"border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-dark-400 hover:dark:text-neutral-200",
										"px-3 py-1.5 text-sm"
									)}
								>
									<span className="flex items-center justify-start">
										{dropdown.icon && (
											<Iconify icon={dropdown.icon} height="16" className="mt-0.5" />
										)}
										<p className={dropdown.icon && "pl-2"}>
											{dropdown.options.find((o) => o.value === dropdownData)?.text ||
												dropdown.initial}
										</p>
									</span>
									<Iconify icon="ic:baseline-expand-more" height="16" className="ml-1" />
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
					(input && inputData.length === 0 && !allowEmptyInput) ||
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
