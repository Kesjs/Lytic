import { LineChart, Line, ResponsiveContainer } from 'recharts'

// Aperçu marketing du dashboard réel — données d'exemple fixes, jamais
// connecté à Supabase. Le vrai dashboard (src/routes/dashboard) reste
// la seule source de chiffres réels.
const trend = [
  { v: 58 }, { v: 61 }, { v: 65 }, { v: 63 }, { v: 70 }, { v: 74 }, { v: 78 },
]

const kpis = [
  { label: 'Mentions', value: '64%' },
  { label: 'Recommandations', value: '41%' },
  { label: 'Position moyenne', value: '#2' },
  { label: 'Présence concurrentielle', value: '77%' },
]

const opportunities = [
  { title: 'Ajouter une page comparatif vs concurrents', priority: 'Haute' as const },
  { title: 'Clarifier la tarification en page d’accueil', priority: 'Moyenne' as const },
]

export function DashboardPreview() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-2xl shadow-black/50">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-border bg-elevated p-5">
          <p className="text-sm text-ink-secondary">Bonjour, Votre marque</p>
          <p className="mt-3 text-xs font-medium text-ink-muted">Visibilité IA</p>
          <div className="mt-1 font-display text-4xl font-bold tabular-nums text-brand-text">
            78 <span className="text-lg text-ink-muted">/ 100</span>
          </div>
          <p className="mt-1 text-sm text-success">↑ 4 depuis la dernière mesure</p>
        </div>

        <div className="rounded-lg border border-border bg-elevated p-5">
          <p className="text-xs font-medium text-ink-muted">Graphique d'évolution</p>
          <div className="mt-3 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <Line type="monotone" dataKey="v" stroke="#f2d94e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-elevated p-4">
            <p className="text-xs text-ink-secondary">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-primary">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-elevated p-5">
        <h3 className="text-sm font-semibold text-ink-primary">Opportunités</h3>
        <ul className="mt-3 space-y-2">
          {opportunities.map((o) => (
            <li
              key={o.title}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-primary"
            >
              <span>{o.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  o.priority === 'Haute' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
                }`}
              >
                {o.priority}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
