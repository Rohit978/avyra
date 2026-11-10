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
        background: "#0b0c0f",
        surface: {
          DEFAULT: "#13151b",
          elevated: "#1c1f26",
          border: "#282c37",
        },
        primary: {
          DEFAULT: "#e50914",
          hover: "#f40612",
        },
        accent: {
          cyan: "#00f0ff",
          purple: "#9d4edd",
        },
      },
      aspectRatio: {
        poster: "2/3",
        backdrop: "16/9",
      },
    },
  },
  plugins: [],
};

