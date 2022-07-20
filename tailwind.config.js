module.exports = {
	darkMode: "class",
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx}",
		"./src/util/**/*.{js,ts,jsx,tsx}",
		"./src/components/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			screens: {
				phone: "540px",
				short: { raw: "(min-height: 800px)" },
				tall: { raw: "(min-height: 900px)" },
			},
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
				shake: {
					"10%, 90%": {
						transform: "translateX(-1px)",
					},
					"20%, 80%": {
						transform: "translateX(2px)",
					},
					"30%, 50%, 70%": {
						transform: "translateX(-4px)",
					},
					"40%, 60%": {
						transform: "translateX(4px)",
					},
				},
			},
			animation: {
				"slide-in": "slide-in 0.3s ease-out",
				shake: "shake 0.82s cubic-bezier(.96,.07,.19,.74) both",
			},
		},
	},
	plugins: [require("@tailwindcss/line-clamp")],
};
