import { createFileRoute, Outlet, useRouterState, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Menu, PanelLeft, RefreshCw, Home, ChevronRight } from 'lucide-react'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { NotificationCenter } from '~/components/dashboard/NotificationCenter'
import { AccountMenu } from '~/components/dashboard/AccountMenu'
import { HeaderMeasureButton } from '~/components/dashboard/HeaderMeasureButton'
import { ThemeToggle } from '~/components/ui/theme-toggle'
import { fetchCurrentBrand } from '~/lib/queries/dashboard'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { cn } from '~/lib/utils'
import { LayoutDashboard, LineChart, Users, Lightbulb, History } from 'lucide-react'

const navItems = [
  { label: 'Accueil', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Performance', to: '/dashboard/performance', icon: LineChart },
  { label: 'Concurrents', to: '/dashboard/concurrents', icon: Users },
  { label: 'Opportunités', to: '/dashboard/opportunites', icon: Lightbulb },
  { label: 'Historique', to: '/dashboard/historique', icon: History },
] as const

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

const pageTitles: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/performance': 'Performance',
  '/dashboard/concurrents': 'Concurrents',
  '/dashboard/opportunites': 'Opportunités',
  '/dashboard/historique': 'Historique',
  '/dashboard/parametres': 'Paramètres',
}

function DashboardLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const queryClient = useQueryClient()
  const isFetching = useIsFetching() > 0
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  async function handleRefresh() {
    if (isManualRefreshing) return
    setIsManualRefreshing(true)
    try {
      // Invalide TOUTES les queries actives (peu importe la page du
      // dashboard consultée) puis attend le refetch réel avant d'arrêter
      // l'animation — pas juste "cliquable", le spinner reflète le vrai
      // état réseau.
      await queryClient.invalidateQueries()
    } finally {
      setIsManualRefreshing(false)
    }
  }
  const { data: brand } = useQuery({
    queryKey: ['current-brand'],
    queryFn: () => fetchCurrentBrand(),
  })

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        window.location.href = '/login'
      }
    }).catch(() => {
      setIsAuthenticated(false)
      window.location.href = '/login'
    })
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="size-5 animate-spin rounded-full border-2 border-ink-muted/30 border-t-brand" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen w-full bg-canvas text-ink-primary font-sans">
      {/* Overlay Backdrop sombre sur mobile quand la sidebar est ouverte */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar (rétractable avec animation fluide sur desktop, tiroir sur mobile) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        navItems={navItems}
        brand={brand}
      />

      {/* Conteneur principal (décalé selon la largeur de la sidebar avec transition animée) */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        }`}
      >
        {/* La "Carte" du Dashboard style Lumail */}
        <div className="flex-1 flex flex-col bg-surface lg:m-2 lg:rounded-2xl border border-border overflow-hidden shadow-sm relative">
          {/* VRAI Header Permanent (Desktop ET Mobile) */}
          <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Bouton Menu sur mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Ouvrir le menu</TooltipContent>
            </Tooltip>

            {/* Bouton Collapse / Rétractation sur grand écran */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  className="hidden lg:flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors"
                  aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
                >
                  <PanelLeft className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}</TooltipContent>
            </Tooltip>

            {/* Fil d'Ariane */}
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1.5 text-xs">
              <Link
                to="/dashboard"
                className="flex items-center text-ink-muted transition-colors hover:text-ink-primary"
                aria-label="Accueil"
              >
                <Home className="size-3.5" />
              </Link>
              <ChevronRight className="size-3.5 text-ink-muted" />
              <span className="font-medium text-ink-primary lg:text-sm lg:font-semibold">{pageTitles[pathname] || 'Tableau de bord'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderMeasureButton />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isManualRefreshing}
                  aria-label="Actualiser le tableau de bord"
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={cn('size-4', (isManualRefreshing || isFetching) && 'animate-spin')} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Actualiser</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <NotificationCenter />
            <div className="lg:hidden">
              <AccountMenu variant="header" />
            </div>
          </div>
        </header>

        {/* Zone de contenu des pages du dashboard */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        </div>
      </div>
    </div>
  )
}
