import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Menu, PanelLeft, RefreshCw } from 'lucide-react'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { NotificationCenter } from '~/components/dashboard/NotificationCenter'
import { AccountMenu } from '~/components/dashboard/AccountMenu'
import { HeaderMeasureButton } from '~/components/dashboard/HeaderMeasureButton'
import { fetchCurrentBrand } from '~/lib/queries/dashboard'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import { cn } from '~/lib/utils'

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

  const currentTitle = pageTitles[pathname] || 'Tableau de bord'

  // Requête légère (juste l'existence d'une marque) pour afficher le badge
  // "Non configuré" dans le header tant que l'onboarding n'est pas fait —
  // repère visuel constant, quelle que soit la page du dashboard consultée.
  const { data: brand, isLoading: isBrandLoading } = useQuery({
    queryKey: ['current-brand'],
    queryFn: () => fetchCurrentBrand(),
  })
  const isBrandConfigured = !isBrandLoading && !!brand

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
    <div className="min-h-screen bg-canvas">
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
      />

      {/* Conteneur principal (décalé selon la largeur de la sidebar avec transition animée) */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60'
        }`}
      >
        {/* VRAI Header Permanent (Desktop ET Mobile) */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-canvas/80 px-4 sm:px-6 backdrop-blur-md">
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

            {/* Fil d'Ariane dynamique — "Reflet /" seulement sur mobile,
                où la sidebar (donc le logo) est cachée derrière le hamburger ;
                sur desktop le logo est déjà visible juste à côté, "Reflet /"
                y est redondant. */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-2 lg:hidden">
                <span className="font-display font-semibold text-ink-primary">Reflet</span>
                <span className="text-border-strong">/</span>
              </span>
              <span className="text-ink-secondary font-medium lg:text-sm lg:font-semibold lg:text-ink-primary">
                {currentTitle}
              </span>

              {/* Repère visuel constant tant que la marque n'est pas créée */}
              {isBrandConfigured === false && (
                <span className="ml-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                  Non configuré
                </span>
              )}
            </div>
          </div>

          {/* Section droite du Header — centre de notifications (§36D.8),
              remplace l'ancien badge "En ligne" qui n'était adossé à
              aucune donnée réelle. Sur mobile, l'avatar donne un accès direct
              au compte/déconnexion sans ouvrir le tiroir puis scroller
              jusqu'en bas de la sidebar. */}
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
  )
}
