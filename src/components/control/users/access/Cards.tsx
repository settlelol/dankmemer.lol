import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ControlCard } from "src/components/ControlCard";
import Input from "src/components/store/Input";

interface Props {
	populateWith?: string;
}

export default function UserAccessControls({ populateWith }: Props) {
	const [populatedWith, setPopulatedWith] = useState<string>(populateWith ?? "");

	useEffect(() => {
		setPopulatedWith(populateWith ?? "");
	}, [populateWith]);

	return (
		<>
			<ControlCard
				endpoint="/api/user/ban?id={{input}}&type={{dropdown}}"
				icon="tabler:hammer"
				title="Restrict access"
				type="destructive"
				input={{
					type: "number",
					label: "Account ID",
					placeholder: "270904126974590976",
					icon: "bxs:id-card",
					value: populatedWith,
					required: true,
				}}
				dropdown={{
					icon: "bx:message-square-dots",
					initial: "Ban type",
					options: [
						{
							text: "Any reason",
							value: "Any",
						},
						{
							text: "Appeal ban",
							value: "Appeal",
						},
						{
							text: "Store ban",
							value: "Lootbox",
						},
						{
							text: "Community ban",
							value: "Community",
						},
					],
				}}
				finish={() => {
					toast.dark("The requested user has been banned!");
				}}
			/>
			<ControlCard
				endpoint="/api/user/unban?id={{input}}&type={{dropdown}}"
				icon="material-symbols:clean-hands-outline-rounded"
				title="Reinstate access"
				type="normal"
				input={{
					type: "number",
					label: "Account ID",
					placeholder: "270904126974590976",
					icon: "bxs:id-card",
					value: populatedWith,
					required: true,
				}}
				dropdown={{
					icon: "bx:message-square-dots",
					initial: "Ban type",
					options: [
						{
							text: "Any reason",
							value: "Any",
						},
						{
							text: "Appeal ban",
							value: "Appeal",
						},
						{
							text: "Store ban",
							value: "Lootbox",
						},
						{
							text: "Community ban",
							value: "Community",
						},
					],
				}}
				finish={() => {
					toast.dark("The requested user has been unbanned!");
				}}
			/>
			<ControlCard
				endpoint="/api/user/bans?id={{input}}&type={{dropdown}}"
				icon="mdi:magnify"
				title="Review access"
				type="normal"
				input={{
					type: "number",
					label: "Account ID",
					placeholder: "270904126974590976",
					icon: "bxs:id-card",
					value: populatedWith,
					required: true,
				}}
				finish={({ data }) => {
					console.log(data);
					toast.dark("Checked");
				}}
			/>
			<ControlCard
				endpoint="/api/user/age-verification/reset?for={{input}}"
				icon="bx:reset"
				title="Reset saved age"
				type="destructive"
				input={{
					type: "number",
					label: "Account ID",
					placeholder: "270904126974590976",
					icon: "bxs:id-card",
					value: populatedWith,
					required: true,
				}}
				finish={() => {
					toast.dark("The requested user has been unbanned!");
				}}
			/>
		</>
	);
}
