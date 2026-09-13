import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

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

  const currentTitle = pageTitles[pathname] || 'Tableau de bord'

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
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-xs text-ink-muted">Chargement de votre espace...</p>
        </div>
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
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-black/80 px-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Bouton Menu sur mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors lg:hidden"
              aria-label="Ouvrir le menu"
              title="Ouvrir le menu"
            >
              <Menu className="size-4" />
            </button>

            {/* Bouton Collapse / Rétractation sur grand écran */}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden lg:flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors"
              title={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
              aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
            >
              <PanelLeft className="size-4" />
            </button>

            {/* Séparateur & Fil d'Ariane dynamique */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-ink-primary">Reflet</span>
              <span className="text-border-strong">/</span>
              <span className="text-ink-secondary font-medium">{currentTitle}</span>
            </div>
          </div>

          {/* Section droite du Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs text-ink-muted">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-[11px] font-medium text-ink-secondary hidden sm:inline">En ligne</span>
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
