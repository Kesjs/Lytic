import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LineChart,
  Users,
  Lightbulb,
  History,
  Settings,
  Plus,
  X,
} from 'lucide-react'
import { AccountMenu } from '~/components/dashboard/AccountMenu'
import { CommandPalette } from '~/components/dashboard/CommandPalette'
import { BrandSetupDrawer } from '~/components/dashboard/BrandSetupDrawer'
import iconUrl from '~/assets/reflet-icon.svg'

export interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

// Sous-ensemble de `brands` nécessaire à l'en-tête — pas besoin du type
// Supabase complet ici, fetchCurrentBrand() reste la seule source de vérité.
export interface SidebarBrand {
  name: string
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  navItems: readonly NavItem[]
  homeUrl?: string
  /** null/undefined = pas encore de marque configurée sur le compte (État A) */
  brand?: SidebarBrand | null
}

export function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  navItems,
  homeUrl = '/dashboard',
  brand,
}: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // Tiroir autonome : la Sidebar existe déjà avant que la marque ne soit
  // configurée (État A), donc elle porte son propre point d'entrée plutôt
  // que de dépendre de l'état ouvert depuis l'Accueil.
  const [setupOpen, setSetupOpen] = useState(false)

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
        {/* En-tête Sidebar : icône Reflet + espace suivi (État A/B) et bouton close mobile */}
        <div
          className={`flex h-14 items-center border-b border-border px-4 transition-all duration-300 ${
            isCollapsed ? 'lg:justify-center' : 'justify-between'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <Link to={homeUrl} className="flex shrink-0 items-center" title="Accueil" onClick={onClose}>
              {brand ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-elevated text-xs font-bold text-ink-primary">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img src={iconUrl} alt="Reflet" className="h-7 w-7" />
              )}
            </Link>

            {!isCollapsed && (
              brand ? (
                // État B — marque configurée : nom de la marque + icône Paramètres
                <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink-primary ml-1">
                    {brand.name}
                  </span>
                  <Link
                    to="/dashboard/parametres"
                    onClick={onClose}
                    title="Paramètres"
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-elevated hover:text-ink-primary"
                  >
                    <Settings className="size-3.5" />
                  </Link>
                </div>
              ) : (
                // État A — compte sans marque : un seul CTA, ouvre le tiroir de setup.
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="-mx-1.5 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink-primary"
                >
                  <Plus className="size-3.5 shrink-0" />
                  <span className="truncate">Configurer ma marque</span>
                </button>
              )
            )}
          </div>

          {/* Bouton fermeture sur mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:text-ink-primary hover:bg-elevated transition-colors lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Recherche / navigation rapide — masquée en mode réduit, faute de place */}
        {!isCollapsed && (
          <div className="border-b border-border px-2.5 py-2">
            <CommandPalette />
          </div>
        )}

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

      {/* Pied de sidebar avec liens et menu profil déroulant */}
      <div className="flex flex-col">
        <div className="border-t border-border p-2.5 mt-auto">
          <AccountMenu variant="sidebar" isCollapsed={isCollapsed} onNavigate={onClose} />
        </div>
      </div>

      <BrandSetupDrawer open={setupOpen} onClose={() => setSetupOpen(false)} />
    </aside>
  )
}
