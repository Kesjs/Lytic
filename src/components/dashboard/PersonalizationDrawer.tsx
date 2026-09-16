import * as React from 'react'
import { X, LayoutTemplate, Sidebar, MonitorPlay } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePreferences } from '~/hooks/use-preferences'
import { cn } from '~/lib/utils'
import { ThemeToggle } from '~/components/ui/theme-toggle'

interface PersonalizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalizationDrawer({ isOpen, onClose }: PersonalizationDrawerProps) {
  const { sidebarState, setSidebarState, dashboardDensity, setDashboardDensity } = usePreferences()

  return (
    <>
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-border bg-surface shadow-2xl sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-sm font-semibold text-ink-primary">Personnalisation</h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-ink-muted hover:bg-elevated hover:text-ink-primary"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                
                {/* Density */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Densité d'affichage</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDashboardDensity('compact')}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-md border p-3 text-xs transition-colors",
                        dashboardDensity === 'compact' 
                          ? "border-brand bg-brand/5 text-brand-text" 
                          : "border-border bg-elevated text-ink-muted hover:border-ink-muted"
                      )}
                    >
                      <LayoutTemplate className="size-5" />
                      <span>Compact (Dense)</span>
                    </button>
                    <button
                      onClick={() => setDashboardDensity('spacious')}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-md border p-3 text-xs transition-colors",
                        dashboardDensity === 'spacious' 
                          ? "border-brand bg-brand/5 text-brand-text" 
                          : "border-border bg-elevated text-ink-muted hover:border-ink-muted"
                      )}
                    >
                      <MonitorPlay className="size-5" />
                      <span>Aéré (Classique)</span>
                    </button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Navigation Latérale</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSidebarState('expanded')}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-xs transition-colors text-left",
                        sidebarState === 'expanded'
                          ? "border-brand bg-brand/5 text-brand-text" 
                          : "border-border bg-elevated text-ink-muted hover:border-ink-muted"
                      )}
                    >
                      <Sidebar className="size-4" />
                      <div>
                        <div className="font-medium">Épinglée</div>
                        <div className="text-[10px] opacity-80">La barre reste visible à gauche</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setSidebarState('hidden')}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-xs transition-colors text-left",
                        sidebarState === 'hidden'
                          ? "border-brand bg-brand/5 text-brand-text" 
                          : "border-border bg-elevated text-ink-muted hover:border-ink-muted"
                      )}
                    >
                      <Sidebar className="size-4 rotate-180" />
                      <div>
                        <div className="font-medium">Masquée</div>
                        <div className="text-[10px] opacity-80">Disparaît pour libérer 100% de l'espace</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Thème Visuel</h3>
                  <div className="flex items-center justify-between rounded-md border border-border bg-elevated p-3">
                    <span className="text-xs text-ink-secondary">Mode sombre / clair</span>
                    <ThemeToggle />
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
