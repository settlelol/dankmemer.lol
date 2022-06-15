import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const sizeClasses = {
	small: "px-3 py-1 rounded-md text-sm",
	medium: "px-5 py-2 rounded-md text-sm",
	"medium-large": "px-10 py-2 rounded-md",
	large: "px-5 py-3 rounded-md",
};

const alignClasses = {
	left: "justify-start",
	center: "justify-center",
	right: "justify-end",
};

const variantClasses = {
	primary: "text-white bg-dank-300 disabled:bg-opacity-75 enabled:hover:bg-opacity-80 transition-colors",
	dark: "text-gray-900 dark:text-white bg-gray-300 disabled:bg-opacity-75 enabled:hover:bg-opacity-80 dark:bg-dank-600 dark:hover:bg-opacity-75 transition-colors",
	danger: "text-white bg-rose-500 disabled:bg-opacity-75 enabled:hover:bg-opacity-80 transition-colors",
};

interface Loading {
	state: boolean;
	text: ReactNode;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	className?: string;
	size?: keyof typeof sizeClasses;
	align?: keyof typeof alignClasses;
	variant?: keyof typeof variantClasses;
	block?: boolean;
	href?: string;
	disabled?: boolean;
	loading?: Loading;
}

export default function Button({
	children,
	className = "",
	size = "medium",
	block = false,
	align = "center",
	variant = "primary",
	href,
	disabled = false,
	loading = {
		state: false,
		text: <></>,
	},
	...props
}: ButtonProps) {
	const content = (
		<button
			disabled={disabled}
			className={clsx(
				"inline-flex items-center font-medium focus:outline-none",
				sizeClasses[size],
				alignClasses[align],
				variantClasses[variant],
				block && "w-full",
				className,
				disabled ? "cursor-not-allowed" : "cursor-pointer"
			)}
			{...props}
		>
			{loading.state ? (
				<p className="flex items-center">
					<span className="mr-3">
						<svg width="20" height="20" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
									<stop stopColor="#fff" stopOpacity="0" offset="0%" />
									<stop stopColor="#fff" stopOpacity=".631" offset="63.146%" />
									<stop stopColor="#fff" offset="100%" />
								</linearGradient>
							</defs>
							<g fill="none" fill-rule="evenodd">
								<g transform="translate(1 1)">
									<path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke="url(#a)" strokeWidth="2">
										<animateTransform
											attributeName="transform"
											type="rotate"
											from="0 18 18"
											to="360 18 18"
											dur="0.9s"
											repeatCount="indefinite"
										/>
									</path>
									<circle fill="#fff" cx="36" cy="18" r="1">
										<animateTransform
											attributeName="transform"
											type="rotate"
											from="0 18 18"
											to="360 18 18"
											dur="0.9s"
											repeatCount="indefinite"
										/>
									</circle>
								</g>
							</g>
						</svg>
					</span>
					{loading.text}
				</p>
			) : (
				children
			)}
		</button>
	);

	if (href) {
		return <Link href={href}>{content}</Link>;
	}

	return content;
}
