import { useState } from "react";
import PagedBanner, { BannerPage } from "../community/PagedBanner";
import { Title } from "../Title";
import Box from "../ui/Box";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import { Icon as Iconify } from "@iconify/react";
import Tooltip from "src/components/ui/Tooltip";
import Input from "./Input";
import axios from "axios";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function BannerEditor() {
	const router = useRouter();
	const [submitInactiveBanner, setSubmitInactiveBanner] = useState(true);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [image, setImage] = useState("");
	const [primaryText, setPrimaryText] = useState("");
	const [primaryUrl, setPrimaryUrl] = useState("");
	const [secondaryText, setSecondaryText] = useState("");
	const [secondaryUrl, setSecondaryUrl] = useState("");

	const [sampleBanner, setSampleBanner] = useState<BannerPage>({
		title,
		description,
		image,
		buttonText: primaryText,
		url: primaryUrl,
		secondaryLink: {
			text: secondaryText,
			url: secondaryUrl,
		},
	});

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
				<div className="mt-5 flex flex-col space-y-2">
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
					<Input
						onChange={(e) => setPrimaryText(e.target.value)}
						type={"text"}
						width="w-full"
						label="Primary button text"
						required
						placeholder="Buy this Rock!"
						value={primaryText}
					/>
					<Input
						onChange={(e) => setPrimaryUrl(e.target.value)}
						type={"text"}
						width="w-full"
						label="Primary button URL"
						required
						placeholder="https://dankmemer.lol/store/cool-rock"
						value={primaryUrl}
					/>
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
				<PagedBanner pages={[sampleBanner]} isStatic />
			</div>
		</div>
	);
}
