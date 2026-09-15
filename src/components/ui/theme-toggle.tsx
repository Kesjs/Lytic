import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/components/theme-provider'
import { cn } from '~/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex rounded-md border border-border bg-elevated p-0.5">
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={cn(
          'flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors',
          theme === 'dark' ? 'bg-brand/10 text-brand-text' : 'text-ink-secondary hover:text-ink-primary',
        )}
      >
        <Moon className="size-3.5" />
        Sombre
      </button>
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        className={cn(
          'flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors',
          theme === 'light' ? 'bg-brand/10 text-brand-text' : 'text-ink-secondary hover:text-ink-primary',
        )}
      >
        <Sun className="size-3.5" />
        Clair
      </button>
    </div>
  )
}
