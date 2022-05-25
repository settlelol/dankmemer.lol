import { Dispatch, SetStateAction, useState } from "react";
import Checkbox from "src/components/ui/Checkbox";

interface Props {
	change: Dispatch<SetStateAction<boolean>>;
}

export default function CheckboxHead({ change }: Props) {
	const [selectedAll, setSelectedAll] = useState(false);

	const selectAll = () => {
		change(!selectedAll);
		setSelectedAll(!selectedAll);
	};

	return <Checkbox className="mt-0" state={selectedAll} style="fill" callback={selectAll} />;
}
