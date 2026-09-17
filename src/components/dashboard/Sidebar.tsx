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
import logoDarkUrl from '~/assets/reflet-horizontal-dark.svg'
import logoLightUrl from '~/assets/reflet-horizontal-light.svg'
import iconUrl from '~/assets/reflet-icon.svg'

export interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  navItems: readonly NavItem[]
  homeUrl?: string
}

export function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  navItems,
  homeUrl = '/dashboard',
}: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between bg-sidebar transition-all duration-300 ease-in-out ${
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
          <div className="flex items-center overflow-hidden">
            <Link to={homeUrl} className="flex items-center">
              {isCollapsed ? (
                <img src={iconUrl} alt="Reflet" className="h-7 w-7 ml-0.5" />
              ) : (
                <>
                  <img src={logoLightUrl} alt="Reflet" className="hidden h-7 dark:block" />
                  <img src={logoDarkUrl} alt="Reflet" className="block h-7 dark:hidden" />
                </>
              )}
            </Link>
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
                className={`group flex items-center rounded-md text-sm transition-all duration-200 ${
                  isCollapsed
                    ? 'justify-center p-2.5'
                    : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-elevated text-ink-primary font-medium shadow-sm ring-1 ring-border/50'
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
