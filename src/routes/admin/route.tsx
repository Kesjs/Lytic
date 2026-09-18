import { createFileRoute, Outlet, useRouterState, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Menu, PanelLeft, LayoutDashboard, Users, Activity, ShieldAlert, Receipt, FileText } from 'lucide-react'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { AccountMenu } from '~/components/dashboard/AccountMenu'
import { ThemeToggle } from '~/components/ui/theme-toggle'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { cn } from '~/lib/utils'

const adminNavItems = [
  { label: 'Vue d\'ensemble', to: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: Users },
  { label: 'Coûts IA', to: '/admin/couts', icon: Activity },
  { label: 'Abus', to: '/admin/abus', icon: ShieldAlert },
  { label: 'Revenus', to: '/admin/revenus', icon: Receipt },
  { label: 'Logs', to: '/admin/logs', icon: FileText },
] as const

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

const pageTitles: Record<string, string> = {
  '/admin': 'Vue d\'ensemble Admin',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/couts': 'Coûts IA',
  '/admin/abus': 'Abus',
  '/admin/revenus': 'Revenus',
  '/admin/logs': 'Logs Système',
}

function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Auto-close menu mobile sur changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Menu burger mobile */}
      <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-border bg-bg/80 p-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-md p-1.5 text-ink-secondary hover:bg-surface hover:text-ink-primary"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-display font-medium text-ink-primary">Reflet Admin</span>
        <div className="h-6 w-6" />
      </div>

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        navItems={adminNavItems}
        homeUrl="/admin"
      />

      {/* Conteneur principal */}
      <div
        className={cn(
          'flex min-h-screen w-full flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        )}
      >
        {/* Header Admin */}
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-border bg-bg/80 px-8 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink-primary"
              aria-label={isCollapsed ? 'Déployer le menu' : 'Réduire le menu'}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <h1 className="font-display text-sm font-semibold text-ink-primary">
              {pageTitles[pathname] || 'Dashboard Admin'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AccountMenu variant="header" />
          </div>
        </header>

        {/* Espace pour le header mobile */}
        <div className="h-16 lg:hidden" />

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
