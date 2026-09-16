/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Toutes les couleurs sémantiques passent par les variables CSS
        // définies dans app.css (.dark / .light) — le format
        // rgb(var(--x) / <alpha-value>) préserve les modificateurs
        // d'opacité Tailwind (bg-brand/10, border-info/30, etc.).
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        ink: {
          primary: 'rgb(var(--color-ink-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-ink-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        // Couleur d'accent Reflet — jaune soufre (reflet-brand-tokens.md)
        // ne jamais en définir une autre / ne jamais en proposer une variante
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
          text: 'rgb(var(--color-brand-text) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
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
