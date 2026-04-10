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
        cream: "#F5F5DC",
        "cream-dark": "#EDE8D0",
        bark: "#3E2723",
        forest: {
          DEFAULT: "#2E7D32",
          light: "#4CAF50",
          dark: "#1B5E20",
        },
        coral: {
          DEFAULT: "#FF8A65",
          light: "#FFAB91",
          dark: "#E64A19",
        },
        moss: "#81C784",
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
