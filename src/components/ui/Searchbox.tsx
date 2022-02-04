import { Dispatch, SetStateAction } from "react";

interface Props {
	placeholder: string;
	setSearch: Dispatch<SetStateAction<string>>;
}

export default function Searchbox({ placeholder, setSearch }: Props) {
	return (
		<div className="flex items-center space-x-1 text-gray-400">
			<div className="material-icons">search</div>
			<input
				onChange={(e) => setSearch(e.target.value)}
				className="appearance-none bg-transparent text-gray-400 placeholder-gray-600 outline-none"
				placeholder={placeholder}
			/>
		</div>
	);
}
