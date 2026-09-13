/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#0f0f0f',
        surface: '#141414',
        elevated: '#1a1a1a',
        border: { DEFAULT: '#262626', strong: '#333333' },
        ink: { primary: '#f5f5f5', secondary: '#a3a3a3', muted: '#6b6b6b' },
        // Couleur d'accent Reflet — jaune soufre (reflet-brand-tokens.md)
        // ne jamais en définir une autre / ne jamais en proposer une variante
        brand: { DEFAULT: '#c9ab1e', hover: '#b3971a', text: '#f2d94e' },
        success: '#22c55e',
        danger: '#ef4444',
        info: '#3b82f6',
        warning: '#f97316',
        dark: {
          bg: '#000000',
          card: '#0a0a0a',
          card2: '#121212',
          border: '#262626',
          border2: '#404040',
          text: '#a3a3a3',
        },
      },
      // Radius modérés uniquement — jamais de pill (rounded-full) sur un CTA
      borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
      maxWidth: { '1200': '1200px' },
    },
  },
  plugins: [],
}
