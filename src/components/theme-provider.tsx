import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

// Doit rester identique à la clé utilisée dans le script anti-flash de
// __root.tsx (RootDocument) — les deux lisent/écrivent la même entrée.
export const THEME_STORAGE_KEY = 'reflet-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Thème par défaut : 'dark', comportement d'origine de Reflet inchangé
// pour quiconque n'a jamais touché au switch (pas de préférence stockée).
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme !== 'light')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  // Synchronise la classe sur <html> et le localStorage à chaque changement.
  // Le script inline dans RootDocument fait déjà ce travail avant le premier
  // paint (anti-flash) — cet effet reste la source de vérité une fois React
  // hydraté, et gère les changements ultérieurs via setTheme/toggleTheme.
  useEffect(() => {
    applyThemeClass(theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function setTheme(next: Theme) {
    setThemeState(next)
  }

  function toggleTheme() {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme() doit être appelé à l\u2019intérieur de <ThemeProvider>.')
  return ctx
}
