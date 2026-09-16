import * as React from 'react'
import { Command } from 'cmdk'
import { useNavigate } from '@tanstack/react-router'
import { Search, Home, Activity, Users, Lightbulb, History, Settings, Play } from 'lucide-react'
import { cn } from '~/lib/utils'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const navigate = useNavigate()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Close when clicking outside
  React.useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    setValue('')
    command()
  }, [])

  return (
    <div className="relative hidden sm:block w-48 md:w-64 lg:ml-2" ref={containerRef}>
      <style>{`
        [cmdk-list] {
          max-height: 300px;
          overflow: auto;
          overscroll-behavior: contain;
        }
        [cmdk-group-heading] {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [cmdk-item] {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--color-ink-secondary);
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        [cmdk-item][data-selected='true'] {
          background: var(--color-elevated);
          color: var(--color-ink-primary);
        }
        [cmdk-item] svg {
          width: 14px;
          height: 14px;
          color: var(--color-ink-muted);
        }
        [cmdk-item][data-selected='true'] svg {
          color: var(--color-ink-primary);
        }
      `}</style>
      <Command shouldFilter={true} className="rounded-md border border-border bg-elevated text-ink-primary shadow-sm" loop>
        <div className="flex items-center px-3 gap-2">
          <Search className="size-4 text-ink-muted shrink-0" />
          <Command.Input 
            ref={inputRef}
            value={value}
            onValueChange={setValue}
            onFocus={() => setOpen(true)}
            placeholder="Search... (ex: Performance)"
            className="flex h-9 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="pointer-events-none flex h-5 items-center gap-1 rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-ink-muted">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50 rounded-md border border-border bg-surface shadow-xl",
          open ? 'block' : 'hidden'
        )}>
          <Command.List className="p-2">
            <Command.Empty className="py-6 text-center text-sm text-ink-muted">Aucun résultat trouvé.</Command.Empty>
            
            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard' }))}>
                <Home /> Accueil
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/performance' }))}>
                <Activity /> Performance
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/concurrents' }))}>
                <Users /> Concurrents
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/opportunites' }))}>
                <Lightbulb /> Opportunités
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/historique' }))}>
                <History /> Historique
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/parametres' }))}>
                <Settings /> Paramètres
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item onSelect={() => runCommand(() => { 
                  const btn = document.querySelector('button[aria-label="Lancer une mesure"]');
                  if (btn instanceof HTMLElement) btn.click();
              })}>
                <Play /> Lancer une nouvelle mesure
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command>
    </div>
  )
}
