import { Title } from "src/components/Title";

interface Props {
	userId: string;
}

export default function CreateCard({}: Props) {
	return (
		<>
			<Title size="medium" className="font-semibold">
				Add a Card
			</Title>
		</>
	);
}
