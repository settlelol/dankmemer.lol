import { useState } from "react";
import Checkbox from "src/components/ui/Checkbox";

export default function CheckboxHead({ change }: any) {
	const [selectedAll, setSelectedAll] = useState(false);

	const selectAll = () => {
		change(!selectedAll);
		setSelectedAll(!selectedAll);
	};

	return (
		<Checkbox
			className="mt-0"
			state={selectedAll}
			style="fill"
			callback={selectAll}
		>
			<></>
		</Checkbox>
	);
}
