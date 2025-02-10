/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#141321",
        secondary: "#1c1b29",
        accent: "#F472B6",
        highlight: "#FFFFFF",
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },

    },
  },
  plugins: [],
};
