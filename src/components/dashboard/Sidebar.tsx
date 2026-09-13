import { useState, useEffect, useRef } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LineChart,
  Users,
  Lightbulb,
  History,
  Settings,
  LogOut,
  ChevronsUpDown,
  X,
  PanelLeft,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

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
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U'

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

      {/* Pied de sidebar avec menu profil déroulant */}
      <div className="relative border-t border-border p-2.5" ref={dropdownRef}>
        {/* Dropdown Popover vers le haut */}
        {isDropdownOpen && (
          <div
            className={`absolute bottom-full mb-2 rounded-lg border border-border bg-zinc-950 p-1.5 shadow-2xl z-50 ${
              isCollapsed
                ? 'left-2 w-56'
                : 'left-2 right-2'
            }`}
          >
            <div className="px-2.5 py-2 border-b border-border/60">
              <p className="text-[11px] font-medium text-ink-muted">Connecté en tant que</p>
              <p className="truncate text-xs font-semibold text-ink-primary mt-0.5">
                {userEmail || 'Utilisateur'}
              </p>
            </div>

            <div className="mt-1 space-y-0.5">
              <Link
                to="/dashboard/parametres"
                onClick={() => {
                  setIsDropdownOpen(false)
                  onClose?.()
                }}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                  pathname.startsWith('/dashboard/parametres')
                    ? 'bg-elevated text-ink-primary'
                    : 'text-ink-secondary hover:bg-elevated/80 hover:text-ink-primary'
                }`}
              >
                <Settings className="size-4 text-ink-muted" />
                Paramètres
              </Link>

              <div className="my-1 border-t border-border/60" />

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false)
                  handleLogout()
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="size-4 text-red-400" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Bouton Déclencheur */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          title={isCollapsed ? (userEmail || 'Mon compte') : undefined}
          className={`flex w-full items-center rounded-lg transition-colors ${
            isCollapsed
              ? 'justify-center p-2'
              : 'gap-2.5 px-2.5 py-2 text-left'
          } ${
            isDropdownOpen
              ? 'bg-elevated text-ink-primary'
              : 'hover:bg-elevated/60 text-ink-secondary hover:text-ink-primary'
          }`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {/* Avatar avec point vert de statut */}
          <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-ink-primary border border-border">
            {userInitial}
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-black"
              title="En ligne"
            />
          </div>

          {/* Email et chevrons (masqués si replié sur grand écran) */}
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink-primary">
                  {userEmail || 'Mon compte'}
                </p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-ink-muted" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
