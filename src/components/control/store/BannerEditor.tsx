import { useEffect, useState } from "react";
import PagedBanner, { BannerPage, PossibleActions } from "../../community/PagedBanner";
import { Title } from "../../Title";
import Box from "../../ui/Box";
import Button from "../../ui/Button";
import Switch from "../../ui/Switch";
import { Icon as Iconify } from "@iconify/react";
import Tooltip from "src/components/ui/Tooltip";
import Input from "../../store/Input";
import axios from "axios";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Dropdown, { Option } from "src/components/ui/Dropdown";
import clsx from "clsx";

type ActionOption = Option & { action: PossibleActions };

const Options: ActionOption[] = [
	{
		label: "Open a Link",
		action: PossibleActions.OPEN_LINK,
	},
];

export default function BannerEditor() {
	const router = useRouter();
	const [submitInactiveBanner, setSubmitInactiveBanner] = useState(true);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [image, setImage] = useState("");

	const [primaryText, setPrimaryText] = useState("");
	const [primaryAction, setPrimaryAction] = useState<ActionOption>();
	const [primaryInput, setPrimaryInput] = useState("");

	const [secondaryText, setSecondaryText] = useState("");
	const [secondaryAction, setSecondaryAction] = useState<ActionOption>();
	const [secondaryInput, setSecondaryInput] = useState("");

	const [sampleBanner, setSampleBanner] = useState<BannerPage>({
		title,
		description,
		image,
		primaryAction: {
			text: primaryText,
			action: primaryAction ? primaryAction.action : PossibleActions.OPEN_LINK,
			input: primaryInput,
		},
		secondaryAction: {
			text: secondaryText,
			action: secondaryAction ? secondaryAction.action : PossibleActions.OPEN_LINK,
			input: secondaryInput,
		},
	});

	useEffect(() => {
		setSampleBanner({
			title,
			description,
			image,
			primaryAction: {
				text: primaryText,
				action: primaryAction ? primaryAction.action : PossibleActions.OPEN_LINK,
				input: primaryInput,
			},
			secondaryAction: {
				text: secondaryText,
				action: secondaryAction ? secondaryAction.action : PossibleActions.OPEN_LINK,
				input: secondaryInput,
			},
		});
	}, [
		title,
		description,
		image,
		primaryText,
		primaryAction,
		primaryInput,
		secondaryText,
		secondaryAction,
		secondaryInput,
	]);

	const createNew = (draft = false) => {
		axios({
			url: `/api/store/banners/add`,
			method: "POST",
			data: sampleBanner,
		})
			.then(() => {
				return router.push(`/store`);
			})
			.catch((e) => {
				toast.dark(e.response.data.error);
			});
	};

	return (
		<div className="">
			<Box>
				<Title size="medium" className="font-semibold">
					Create a new Banner
				</Title>
				<div className="mt-5 flex flex-col space-y-3">
					<Input
						onChange={(e) => setTitle(e.target.value)}
						type={"text"}
						width="w-full"
						label="Title"
						required
						placeholder="A cool rock"
						value={title}
					/>
					<Input
						onChange={(e) => setDescription(e.target.value)}
						type={"text"}
						width="w-full"
						label="Description"
						required
						placeholder="Check out this really cool rock"
						value={description}
					/>
					<Input
						onChange={(e) => setImage(e.target.value)}
						type={"text"}
						width="w-full"
						label="Image URL"
						required
						placeholder="https://link-to-c.ooo/L/rock.png"
						value={image}
					/>
					<div className="flex w-full space-x-5">
						<div className="flex w-1/2 flex-col space-y-3">
							<Input
								onChange={(e) => setPrimaryText(e.target.value)}
								type={"text"}
								width="w-full"
								label="Primary button text"
								required
								placeholder="Buy this Rock!"
								value={primaryText}
							/>
							<div className="flex w-full items-center justify-between space-x-5">
								<div className="w-1/3">
									<p className="mb-1 text-neutral-600 dark:text-neutral-300">
										Primary action
										<sup className="text-red-500">*</sup>
									</p>
									<Dropdown
										content={
											<div
												className={clsx(
													"flex items-center justify-between",
													"rounded-md border-[1px] border-[#3C3C3C]",
													"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
													"w-full px-3 py-2 text-sm"
												)}
											>
												<p>{primaryAction ? primaryAction.label : "Select one"}</p>
												<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
											</div>
										}
										options={Options.map((option) => ({
											label: option.label,
											onClick: () => setPrimaryAction(option),
										}))}
										isInput={false}
										requireScroll={false}
									/>
								</div>
								<div className="w-2/3">
									<Input
										onChange={(e) => setPrimaryInput(e.target.value)}
										type={"text"}
										width="w-full"
										label="Primary Action Input"
										required
										placeholder="Some kind of input to provide to the function selected"
										value={primaryInput}
									/>
								</div>
							</div>
						</div>
						<div className="flex w-1/2 flex-col space-y-3">
							<Input
								onChange={(e) => setSecondaryText(e.target.value)}
								type={"text"}
								width="w-full"
								label="Secondary button text"
								placeholder="Learn more"
								value={secondaryText}
							/>
							<div className="flex w-full items-center justify-between space-x-5">
								<div className="w-1/3">
									<p className="mb-1 text-neutral-600 dark:text-neutral-300">Secondary action</p>
									<Dropdown
										content={
											<div
												className={clsx(
													"flex items-center justify-between",
													"rounded-md border-[1px] border-[#3C3C3C]",
													"bg-light-500 transition-colors dark:bg-black/40 dark:text-neutral-400",
													"w-full px-3 py-2 text-sm"
												)}
											>
												<p>{secondaryAction ? secondaryAction.label : "Select one"}</p>
												<Iconify icon="ic:baseline-expand-more" height={15} className="ml-1" />
											</div>
										}
										options={Options.map((option) => ({
											label: option.label,
											onClick: () => setSecondaryAction(option),
										}))}
										isInput={false}
										requireScroll={false}
									/>
								</div>
								<div className="w-2/3">
									<Input
										onChange={(e) => setSecondaryInput(e.target.value)}
										type={"text"}
										width="w-full"
										label="Secondary Action Input"
										placeholder="Some kind of input to provide to the function selected"
										value={secondaryInput}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end space-x-4">
						<div className="flex items-center justify-end space-x-2 text-red-400">
							<p className="flex items-center space-x-2">
								<span>
									Create banner as <span className="font-bold">inactive</span>
								</span>
								<Tooltip
									content={
										<>
											Active banners are visible to customers on the store.
											<br />
											Inactive are hidden but can be managed here.
										</>
									}
								>
									<Iconify icon="ant-design:question-circle-filled" />
								</Tooltip>
							</p>
							<Switch
								checked={submitInactiveBanner}
								variant="normal"
								onClick={() => setSubmitInactiveBanner((curr) => !curr)}
							/>
						</div>
						<Button variant="primary" onClick={() => createNew()}>
							Submit banner details
						</Button>
					</div>
				</div>
			</Box>
			<div className="mt-5">
				<PagedBanner displayPage={sampleBanner} height={"h-auto md:h-72"} />
			</div>
		</div>
	);
}
