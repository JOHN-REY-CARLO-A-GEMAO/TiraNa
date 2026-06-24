/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#CB2957',
        dark: '#000000',
        'gray-light': '#DDDDDD',
        'gray-lighter': '#EEEEEE',
      },
    },
  },
  plugins: [],
}
