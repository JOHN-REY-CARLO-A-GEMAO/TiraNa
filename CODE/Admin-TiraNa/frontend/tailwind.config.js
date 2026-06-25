/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F5',
          100: '#FBE6EB',
          200: '#F7CDD8',
          300: '#F3B4C4',
          400: '#EF9BB1',
          500: '#CB2957',
          600: '#A72147',
          700: '#831A38',
          800: '#5F1328',
          900: '#3B0C19',
          DEFAULT: '#CB2957',
        },
        dark: '#000000',
        'gray-light': '#DDDDDD',
        'gray-lighter': '#EEEEEE',
      },
    },
  },
  plugins: [],
}
