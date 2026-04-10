import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        "cream-dark": "#FFF0E0",
        bark: "#3A3A3A",
        forest: {
          DEFAULT: "#E53935",
          light: "#EF5350",
          dark: "#C62828",
        },
        coral: {
          DEFAULT: "#FF8A65",
          light: "#FFAB91",
          dark: "#E64A19",
        },
        moss: "#FF8A65",
      },
      fontFamily: {
        heading: ["var(--font-fredoka)", "sans-serif"],
        sans: ["var(--font-nunito)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
