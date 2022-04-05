import { useEffect, useState } from "react";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	id: string;
	name: string;
}

export default function ProductEditor({ id, name }: Props) {
	const [productId, setProductId] = useState("");
	const [productName, setProductName] = useState(name);

	const [primaryTitle, setPrimaryTitle] = useState("");

	useEffect(() => {
		setProductId(id);
	}, [id]);

	useEffect(() => {
		setProductName(name);
	}, [name]);

	useEffect(() => {
		return () => {
			setProductId("");
			setProductName("");
		};
	}, []);

	return (
		<>
			<Title size="big">Edit product</Title>
			<p className="text-neutral-600 dark:text-neutral-400">
				Edit both website data and Stripe data for '{name}'
			</p>
			<div className="mt-4 space-y-5">
				<Input
					width="w-full"
					type={"text"}
					placeholder={"Dank Memer 2"}
					value={productName}
					onChange={(e) => setProductName(e.target.value)}
					label={
						<>
							Product name<sup className="text-red-500">*</sup>
						</>
					}
				/>
				<Input
					width="w-full"
					type={"text"}
					placeholder={"Exclusive benefits"}
					defaultValue={"Exclusive benefits"}
					value={primaryTitle}
					onChange={(e) => setPrimaryTitle(e.target.value)}
					label={
						<>
							Primary description title
							<sup className="text-red-500">*</sup>
						</>
					}
				/>
				<div className="">
					<label className="mb-1 text-neutral-600 dark:text-neutral-300">
						Content for '
						{primaryTitle.length >= 1
							? primaryTitle
							: "Exclusive benefits"}
						'<sup className="text-red-500">*</sup>
					</label>
					<textarea className="min-h-[38px] w-full resize-y rounded-md border-[1px] border-neutral-300 px-3 py-2 font-inter text-sm focus-visible:border-dank-300 focus-visible:outline-none dark:border-neutral-700 dark:bg-black/30" />
				</div>
				<div className="grid cursor-pointer select-none place-items-center">
					<div className="flex w-full max-w-xs items-center justify-center space-x-2 rounded-lg py-2 transition-colors dark:bg-dank-400 dark:text-neutral-400 hover:dark:bg-dank-300 hover:dark:text-white">
						<Iconify icon="bx:plus" height={20} />
						<p>Add secondary details</p>
					</div>
				</div>
			</div>
		</>
	);
}
