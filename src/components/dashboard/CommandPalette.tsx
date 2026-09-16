import * as React from 'react'
import { Command } from 'cmdk'
import { useNavigate } from '@tanstack/react-router'
import { Search, Home, Activity, Users, Lightbulb, History, Settings, Play } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <style>{`
        [cmdk-overlay] {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          z-index: 50;
        }
        [cmdk-dialog] {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 51;
          width: 90%;
          max-width: 640px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        [cmdk-input] {
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--color-border);
          padding: 16px 20px;
          font-size: 16px;
          background: transparent;
          color: var(--color-ink-primary);
          outline: none;
        }
        [cmdk-input]::placeholder {
          color: var(--color-ink-muted);
        }
        [cmdk-list] {
          max-height: 400px;
          overflow: auto;
          padding: 8px;
        }
        [cmdk-group-heading] {
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [cmdk-item] {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          font-size: 14px;
          color: var(--color-ink-secondary);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        [cmdk-item][data-selected='true'] {
          background: var(--color-elevated);
          color: var(--color-ink-primary);
        }
        [cmdk-item] svg {
          width: 16px;
          height: 16px;
          color: var(--color-ink-muted);
        }
        [cmdk-item][data-selected='true'] svg {
          color: var(--color-ink-primary);
        }
        [cmdk-empty] {
          padding: 24px;
          text-align: center;
          font-size: 14px;
          color: var(--color-ink-muted);
        }
      `}</style>
      <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu">
        <Command.Input placeholder="Tapez une commande ou cherchez... (ex: Performance)" />
        <Command.List>
          <Command.Empty>Aucun résultat trouvé.</Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard' }))}>
              <Home />
              Accueil
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/performance' }))}>
              <Activity />
              Performance
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/concurrents' }))}>
              <Users />
              Concurrents
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/opportunites' }))}>
              <Lightbulb />
              Opportunités
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/historique' }))}>
              <History />
              Historique
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate({ to: '/dashboard/parametres' }))}>
              <Settings />
              Paramètres
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions">
            <Command.Item onSelect={() => runCommand(() => { 
                const btn = document.querySelector('button[aria-label="Lancer une mesure"]');
                if (btn instanceof HTMLElement) btn.click();
            })}>
              <Play />
              Lancer une nouvelle mesure
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  )
}
