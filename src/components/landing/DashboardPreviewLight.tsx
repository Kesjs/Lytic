import { LayoutDashboard, LineChart as LineChartIcon, Users, Lightbulb, History as HistoryIcon } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

// Capture illustrative du dashboard réel, forcée en thème clair (classe .light,
// cf. src/styles/app.css) pour contraster avec le fond sombre de la landing —
// même convention que DashboardPreview.tsx : données d'exemple fixes, jamais
// connectées à Supabase. Nav et libellés copiés de Sidebar.tsx pour rester fidèles
// à l'app réelle. Le score (68) reprend celui de la section Historique.

const navItems = [
  { label: 'Accueil', icon: LayoutDashboard, active: true },
  { label: 'Performance', icon: LineChartIcon },
  { label: 'Concurrents', icon: Users },
  { label: 'Opportunités', icon: Lightbulb },
  { label: 'Historique', icon: HistoryIcon },
]

const trend = [{ v: 58 }, { v: 61 }, { v: 60 }, { v: 64 }, { v: 63 }, { v: 66 }, { v: 68 }]

const kpis = [
  { label: 'Présence', value: '71%' },
  { label: 'Recommandation', value: '44%' },
  { label: 'Positionnement', value: '#2' },
  { label: 'Concurrence', value: '3 marques' },
]

export function DashboardPreviewLight() {
  return (
    <div className="light overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
      <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[180px_1fr]">
        {/* Sidebar — items réels de src/components/dashboard/Sidebar.tsx */}
        <div className="border-r border-border bg-elevated p-3 sm:p-4">
          <div className="mb-6 flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-black sm:ml-1">
            R
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium ${
                    item.active
                      ? 'bg-brand/10 text-brand-text'
                      : 'text-ink-secondary'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="p-4 sm:p-6">
          <p className="text-sm text-ink-secondary">Bonjour, SIKKA</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-lg border border-border bg-canvas p-4">
              <p className="text-xs font-medium text-ink-muted">Visibilité IA</p>
              <div className="mt-1 font-display text-4xl font-bold tabular-nums text-brand-text">
                68 <span className="text-base text-ink-muted">/ 100</span>
              </div>
              <p className="mt-1 text-xs text-success">↑ 4 depuis la dernière mesure</p>
            </div>

            <div className="rounded-lg border border-border bg-canvas p-4">
              <p className="text-xs font-medium text-ink-muted">Évolution du score</p>
              <div className="mt-2 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <Line type="monotone" dataKey="v" stroke="#8a6c08" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-lg border border-border bg-canvas p-3">
                <p className="text-[11px] text-ink-secondary">{k.label}</p>
                <p className="mt-1 font-display text-lg font-semibold tabular-nums text-ink-primary">
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
