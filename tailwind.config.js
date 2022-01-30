module.exports = {
	darkMode: "class",
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx}",
		"./src/util/**/*.{js,ts,jsx,tsx}",
		"./src/components/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				montserrat: ["Montserrat"],
				inter: ["Inter"],
			},
			colors: {
				dank: {
					100: "#65ce8f",
					200: "#14763d",
					300: "#199532",
					400: "#2E442E",
					500: "#1e271f",
					600: "#233026",
				},
				dark: {
					100: "#171f19",
					200: "#121b13",
					300: "#1C271D",
					400: "#0b110c",
					500: "#080c08",
				},
				light: {
					100: "#ffffff",
					200: "#FBFFFB",
					300: "#eafcf1",
					400: "#F0FBF0",
					500: "#ececec",
					600: "#7f8a7f",
				},
			},
			keyframes: {
				"slide-in": {
					"0%": {
						opacity: "0",
						transform: "translateY(-30px)",
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)",
					},
				},
			},
			animation: {
				"slide-in": "slide-in 0.3s ease-out",
			},
		},
	},
	plugins: [require("@tailwindcss/line-clamp")],
};
