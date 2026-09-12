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
          bg: '#090e1a',
          card: '#111827',
          card2: '#1f2937',
          border: '#1f2937',
          border2: '#374151',
          text: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
}
