import FancyButton from "./ui/FancyButton";

export default function BottomCTA() {
	return (
		<div className="flex flex-col items-center space-y-2 text-center font-montserrat">
			<h1 className="text-3xl font-bold text-dark-500 dark:text-white">
				Join the family!
			</h1>
			<p className="text-dark-500 dark:text-white">
				Add Dank Memer to your Discord server.
			</p>
			<FancyButton
				link="https://invite.dankmemer.lol"
				text="INVITE NOW"
			/>
		</div>
	);
}
