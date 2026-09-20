import {
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Radar,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

// Aperçu marketing du dashboard réel — recréé en JSX (pas un screenshot),
// pour rester net et lisible à l'échelle hero. Données d'exemple fixes,
// copiées de public/images/dashboard/overview.png, jamais connectées à
// Supabase. Le vrai dashboard (src/routes/dashboard) reste la seule
// source de chiffres réels.

const kpis = [
  { label: 'Mentions', value: '84%', delta: '+2%', up: true, icon: MessageSquare },
  { label: 'Recommandations', value: '64%', delta: '+5%', up: true, icon: ThumbsUp },
  { label: 'Pos. moyenne', value: '#1.9', delta: '-0.2', up: false, icon: TrendingUp },
  { label: 'Présence', value: '100%', delta: null, up: null, icon: Radar },
]

const voice = [
  { label: 'Nooma', value: 42, pct: 100 },
  { label: 'Zendesk', value: 39, pct: 93 },
  { label: 'Intercom', value: 31, pct: 74 },
  { label: 'Front', value: 29, pct: 69 },
]

const engines = [
  { label: 'ChatGPT', value: '84%', pct: 84 },
  { label: 'Gemini', value: '70%', pct: 70 },
  { label: 'Perplexity', value: '60%', pct: 60 },
  { label: 'Copilot', value: '40%', pct: 40 },
]

const tone = { positive: 64, neutral: 20, negative: 16 }

export function DashboardPreview() {
  // Donut "Tonalité" en conic-gradient — léger, pas de lib de charting requise
  const p1 = tone.positive
  const p2 = tone.positive + tone.neutral
  const donutStyle = {
    background: `conic-gradient(#22c55e 0% ${p1}%, #6b7280 ${p1}% ${p2}%, #ef4444 ${p2}% 100%)`,
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      {/* Score global + KPIs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <div className="rounded-xl border border-border bg-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-secondary">Score global</p>
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-ink-muted">
              Nooma
            </span>
          </div>
          <div className="mt-3 font-display text-6xl font-bold tabular-nums text-brand-text sm:text-7xl">
            96<span className="text-2xl text-ink-muted"> / 100</span>
          </div>
          <p className="mt-2 text-sm font-medium text-success">↑ 3 pts depuis la dernière mesure</p>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-ink-secondary">
              <span className="font-medium text-ink-primary">Mesure partielle</span> — certaines
              questions n'ont pas pu être mesurées.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-elevated p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-secondary">{k.label}</p>
                <k.icon className="size-4 text-ink-muted" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink-primary sm:text-4xl">
                {k.value}
              </p>
              {k.delta && (
                <p className={`mt-1 text-xs font-medium ${k.up ? 'text-success' : 'text-danger'}`}>
                  {k.delta} vs sem. dernière
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Insight IA */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 sm:p-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
          <Sparkles className="size-4 text-violet-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-primary">Insight IA</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
            Bonne progression cette semaine : votre taux de recommandation a augmenté de{' '}
            <span className="font-semibold text-ink-primary">+5%</span> par rapport à vos
            concurrents principaux.
          </p>
        </div>
      </div>

      {/* Part de Voix / Moteurs IA / Tonalité */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-elevated p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-primary">Part de Voix</p>
          <div className="mt-3 space-y-3">
            {voice.map((v) => (
              <div key={v.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
                  <span>{v.label}</span>
                  <span className="font-medium text-ink-primary">{v.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${v.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-elevated p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-primary">Moteurs IA</p>
          <div className="mt-3 space-y-3">
            {engines.map((e) => (
              <div key={e.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
                  <span>{e.label}</span>
                  <span className="font-medium text-ink-primary">{e.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-elevated p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink-primary">Tonalité</p>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative flex size-28 items-center justify-center rounded-full" style={donutStyle}>
              <div className="flex size-20 flex-col items-center justify-center rounded-full bg-elevated">
                <span className="font-display text-xl font-bold text-ink-primary">{tone.positive}%</span>
                <span className="text-[10px] uppercase tracking-wide text-success">Positif</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-ink-secondary">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Positif {tone.positive}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gray-500" /> Neutre {tone.neutral}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-danger" /> Négatif {tone.negative}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
