import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from '~/components/dashboard/Sidebar'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

      {/* Sidebar (fixe sur desktop, tiroir sur mobile) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Header mobile réactif avec bouton Menu / Toggle */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-black/90 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-brand text-xs font-black text-black">
              R
            </div>
            <span className="text-sm font-semibold text-ink-primary">Reflet</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-2.5 py-1 text-xs text-ink-muted">
          <span className="size-2 rounded-full bg-success" />
          <span className="text-[11px] font-medium text-ink-secondary">En ligne</span>
        </div>
      </header>

      {/* Zone de contenu principal fluide et responsive */}
      <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen lg:ml-60 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
