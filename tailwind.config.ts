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
        // Warm paper palette — never cold white
        paper: {
          DEFAULT: "#F4EFE7", // page base
          card: "#FAF7F2", // card surface
        },
        // Primary tomato red
        tomato: {
          DEFAULT: "#B63F39",
          button: "#C94B44", // button fill
          light: "#C94B44",
          dark: "#9A332E",
        },
        // Ink text
        ink: {
          strong: "#2B1E1B",
          DEFAULT: "#5A4742",
          light: "#8C7B75",
        },
        // Muted botanical neutral accent (subtle borders/chips only)
        botanical: "#D8DED6",
        // Positive / fresh semantic green (use sparingly)
        fresh: {
          DEFAULT: "#6E8B6A",
          soft: "#EAF0E6",
        },
      },
      fontFamily: {
        heading: ["var(--font-shippori)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        btn: "24px",
        input: "16px",
        "2xl": "18px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
