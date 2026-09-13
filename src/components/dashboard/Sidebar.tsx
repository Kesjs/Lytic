import { useState, useEffect } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LineChart,
  Users,
  Lightbulb,
  History,
  Settings,
  LogOut,
  User,
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

export function Sidebar() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    navigate({ to: '/login' })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col justify-between border-r border-border bg-black">
      <div>
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex size-8 items-center justify-center rounded-md bg-brand text-sm font-black text-black">
            R
          </div>
          <span className="text-sm font-semibold text-ink-primary">Reflet</span>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {navItems.map((item) => {
            const isActive =
              item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-elevated text-ink-primary'
                    : 'text-ink-secondary hover:bg-elevated/60 hover:text-ink-primary'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border p-3 space-y-1">
        {userEmail && (
          <div className="flex items-center gap-2 rounded-md bg-elevated/40 px-3 py-2 text-xs text-ink-secondary">
            <span className="size-2 rounded-full bg-success shrink-0" />
            <span className="truncate text-ink-primary font-medium">{userEmail}</span>
          </div>
        )}
        <Link
          to="/dashboard/parametres"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            pathname.startsWith('/dashboard/parametres')
              ? 'bg-elevated text-ink-primary'
              : 'text-ink-secondary hover:bg-elevated/60 hover:text-ink-primary'
          }`}
        >
          <Settings className="size-4" />
          Paramètres
        </Link>
        <button
          onClick={handleLogout}
          className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-elevated/60 hover:text-danger"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
