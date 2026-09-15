import { useTheme } from '~/components/theme-provider'
import { AnimatedThemeToggler } from '~/components/ui/animated-theme-toggler'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      variant="circle"
      className="flex size-8 items-center justify-center rounded-md border border-border bg-elevated text-ink-secondary transition-colors hover:text-ink-primary"
    />
  )
}
