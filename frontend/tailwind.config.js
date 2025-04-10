/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#143261",
        lightgray: "#F1F3F7",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
