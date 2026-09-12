/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3758f9',
          hover: '#2647eb',
          light: '#eef2ff',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#3758f9',
          600: '#2647eb',
          700: '#1d35c4',
        },
        dark: {
          bg: '#000000',
          card: '#0a0a0a',
          card2: '#121212',
          border: '#262626',
          border2: '#404040',
          text: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
}
