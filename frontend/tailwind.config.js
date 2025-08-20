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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        highlight: {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgb(134, 239, 172)' },
          '100%': { backgroundColor: 'transparent' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideInRight: 'slideInRight 0.5s ease-in-out',
        highlight: 'highlight 2s ease-in-out'
      }
    },
  },
  plugins: [],
}
