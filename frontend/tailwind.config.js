/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#9B6A6C",
        secondary: "#885A5E",
        accent: "#935FA7",
        background: "#9A6C74",
        textPrimary: "#ffffff",
        textSecondary: "#f3f3f3",
      },
    },
  },
  plugins: [],
};
