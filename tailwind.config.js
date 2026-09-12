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
        canvas: '#0a0a0a',
        surface: '#131313',
        elevated: '#1a1a1a',
        border: { DEFAULT: '#262626', strong: '#333333' },
        ink: { primary: '#f5f5f5', secondary: '#a3a3a3', muted: '#6b6b6b' },
        brand: { DEFAULT: '#F5C518', hover: '#D9AC0E' },
        success: '#22c55e',
        danger: '#ef4444',
        info: '#3b82f6',
        warning: '#f97316',
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
      borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
      maxWidth: { '1200': '1200px' },
    },
  },
  plugins: [],
}
