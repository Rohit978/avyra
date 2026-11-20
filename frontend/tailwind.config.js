/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#07080d",
        surface: {
          DEFAULT: "#0e1017",
          elevated: "#151822",
          border: "#232736",
        },
        primary: {
          DEFAULT: "#e11d48",
          hover: "#f43f5e",
        },
        accent: {
          gold: "#fbbf24",
          cyan: "#00f0ff",
          purple: "#9d4edd",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      aspectRatio: {
        poster: "2/3",
        backdrop: "16/9",
      },
    },
  },
  plugins: [],
};
