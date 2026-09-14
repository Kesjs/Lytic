import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LineChart,
  Users,
  Lightbulb,
  History,
  X,
} from 'lucide-react'
import { AccountMenu } from '~/components/dashboard/AccountMenu'

// Items réels du dashboard Reflet (reflet-prompt-dashboard.md §3).
// Jamais de jargon interne ici (Run, Measurement Engine, Observation…).
const navItems = [
  { label: 'Accueil', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Performance', to: '/dashboard/performance', icon: LineChart },
  { label: 'Concurrents', to: '/dashboard/concurrents', icon: Users },
  { label: 'Opportunités', to: '/dashboard/opportunites', icon: Lightbulb },
  { label: 'Historique', to: '/dashboard/historique', icon: History },
] as const

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-border bg-black transition-all duration-300 ease-in-out ${
        /* Mobile: glissement depuis la gauche */
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${
        /* Desktop: largeur rétractable */
        isCollapsed ? 'lg:w-[68px]' : 'lg:w-60'
      } w-60`}
    >
      <div>
        {/* En-tête Sidebar avec Logo et bouton collapse / close */}
        <div
          className={`flex h-14 items-center border-b border-border px-4 transition-all duration-300 ${
            isCollapsed ? 'lg:justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand font-display text-sm font-bold text-black">
              R
            </div>
            {!isCollapsed && (
              <span className="font-display text-sm font-semibold text-ink-primary whitespace-nowrap transition-opacity duration-200">
                Reflet
              </span>
            )}
          </div>

          {/* Bouton fermeture sur mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:text-ink-primary hover:bg-elevated transition-colors lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation principale */}
        <nav className="flex flex-col gap-1 p-2.5">
          {navItems.map((item) => {
            const isActive =
              item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-md text-sm transition-colors ${
                  isCollapsed
                    ? 'justify-center p-2.5'
                    : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-elevated text-ink-primary font-medium'
                    : 'text-ink-secondary hover:bg-elevated/60 hover:text-ink-primary'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Pied de sidebar avec menu profil déroulant (composant partagé
          avec l'accès rapide au compte dans le Header mobile) */}
      <div className="border-t border-border p-2.5">
        <AccountMenu variant="sidebar" isCollapsed={isCollapsed} onNavigate={onClose} />
      </div>
    </aside>
  )
}
