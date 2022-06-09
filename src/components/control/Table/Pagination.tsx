import { TableInstance } from "@tanstack/react-table";
import Button from "src/components/ui/Button";
import { Icon as Iconify } from "@iconify/react";

interface Props {
	instance: TableInstance<any>;
}

export default function Pagination({ instance }: Props) {
	return (
		<>
			{(instance.getCanNextPage() || instance.getCanPreviousPage()) && (
				<div className="mt-5 grid w-full place-items-center">
					<div className="flex items-center justify-center space-x-5">
						<Button
							variant={instance.getCanPreviousPage() ? "primary" : "dark"}
							disabled={!instance.getCanPreviousPage()}
							onClick={() => {
								if (instance.getCanPreviousPage()) {
									instance.previousPage();
								}
							}}
						>
							<Iconify icon="tabler:chevron-left" />
						</Button>
						<Button
							variant={instance.getCanNextPage() ? "primary" : "dark"}
							disabled={!instance.getCanNextPage()}
							onClick={() => {
								if (instance.getCanNextPage()) {
									instance.nextPage();
								}
							}}
						>
							<Iconify icon="tabler:chevron-right" />
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
