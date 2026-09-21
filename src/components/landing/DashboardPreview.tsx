import {
  LayoutDashboard,
  BarChart3,
  Users,
  Lightbulb,
  History,
  Search,
  RefreshCw,
  Sun,
  Bell,
  Lock,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Radar,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

// Aperçu marketing du dashboard réel — recréé en JSX (pas un screenshot),
// pour rester net à l'échelle hero tout en restant fidèle à l'app réelle
// (sidebar, topbar, cards). Données d'exemple fixes, copiées de
// public/images/dashboard/overview.png, jamais connectées à Supabase.
// Le vrai dashboard (src/routes/dashboard) reste la seule source de
// chiffres réels.

const navItems = [
  { label: 'Accueil', icon: LayoutDashboard, active: true },
  { label: 'Performance', icon: BarChart3 },
  { label: 'Concurrents', icon: Users },
  { label: 'Opportunités', icon: Lightbulb },
  { label: 'Historique', icon: History },
]

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
  { label: 'chatgpt', value: '84%', pct: 84 },
  { label: 'gemini', value: '70%', pct: 70 },
  { label: 'perplexity', value: '60%', pct: 60 },
  { label: 'copilot', value: '40%', pct: 40 },
]

const tone = { positive: 64, neutral: 20, negative: 16 }

export function DashboardPreview() {
  const p1 = tone.positive
  const p2 = tone.positive + tone.neutral
  const donutStyle = {
    background: `conic-gradient(#22c55e 0% ${p1}%, #6b7280 ${p1}% ${p2}%, #ef4444 ${p2}% 100%)`,
  }

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(201,171,30,0.12)]">
      <div className="overflow-hidden rounded-[15px] bg-[#0c0c0e]">
        {/* Barre "navigateur" — cadre de fenêtre */}
        <div className="flex h-9 items-center justify-between border-b border-white/[0.07] bg-[#141416]/95 px-3.5 backdrop-blur-md sm:h-10 sm:px-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f56]/85 ring-1 ring-[#ff5f56]/30" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]/85 ring-1 ring-[#ffbd2e]/30" />
            <span className="size-2.5 rounded-full bg-[#27c93f]/85 ring-1 ring-[#27c93f]/30" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/50 px-2.5 py-0.5 text-[11px] font-mono text-ink-muted">
            <Lock className="size-2.5 text-brand-text opacity-75" />
            <span>tryreflet.pro/dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="hidden sm:inline">Reflet</span>
          </div>
        </div>

        {/* Corps app : sidebar + contenu */}
        <div className="flex bg-[#0a0a0c]">
          {/* Sidebar */}
          <aside className="flex w-14 shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e10] p-2.5 sm:w-[168px] sm:p-3.5">
            <div className="mb-4 flex items-center gap-2 px-0.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-black">
                N
              </div>
              <span className="hidden truncate text-xs font-semibold text-ink-primary sm:inline">
                Nooma
              </span>
            </div>
            <div className="mb-3 hidden items-center gap-1.5 rounded-md border border-white/[0.07] bg-black/40 px-2 py-1.5 text-[10px] text-ink-muted sm:flex">
              <Search className="size-3" />
              <span>Search...</span>
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium ${
                    item.active ? 'bg-brand/10 text-brand-text' : 'text-ink-secondary'
                  }`}
                >
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="hidden truncate sm:inline">{item.label}</span>
                </div>
              ))}
            </nav>
            <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
              <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-semibold text-ink-primary">
                K
                <span className="absolute -bottom-px -right-px size-1.5 rounded-full bg-emerald-500 ring-1 ring-[#0e0e10]" />
              </span>
              <span className="hidden truncate text-[10px] text-ink-muted sm:inline">
                ken2001babatounde...
              </span>
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="min-w-0 flex-1 p-3 sm:p-4">
            {/* Topbar */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <LayoutDashboard className="size-3" />
                <span>›</span>
                <span className="text-ink-primary">Accueil</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[10px] font-semibold text-black sm:flex">
                  Mesurer
                </span>
                <RefreshCw className="size-3 text-ink-muted" />
                <Sun className="size-3 text-ink-muted" />
                <div className="relative">
                  <Bell className="size-3 text-ink-muted" />
                  <span className="absolute -right-1 -top-1 flex size-2.5 items-center justify-center rounded-full bg-danger text-[6px] font-bold text-white">
                    5
                  </span>
                </div>
              </div>
            </div>

            {/* Score global + KPIs */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[38%_1fr]">
              <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-ink-secondary">Score global</p>
                  <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-ink-muted">
                    Nooma
                  </span>
                </div>
                <div className="mt-1.5 font-display text-3xl font-bold tabular-nums text-brand-text sm:text-4xl">
                  96<span className="text-sm text-ink-muted"> / 100</span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-success">
                  ↑ 3 pts depuis la dernière mesure
                </p>
                <div className="mt-2.5 flex items-start gap-1.5 rounded-md border border-warning/20 bg-warning/10 p-2">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning" />
                  <p className="text-[9px] leading-relaxed text-ink-secondary">
                    <span className="font-medium text-ink-primary">Mesure partielle</span> —
                    certaines questions n'ont pas pu être mesurées.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-ink-secondary">{k.label}</p>
                      <k.icon className="size-3 text-ink-muted" />
                    </div>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums text-ink-primary sm:text-xl">
                      {k.value}
                    </p>
                    {k.delta && (
                      <p className={`text-[9px] font-medium ${k.up ? 'text-success' : 'text-danger'}`}>
                        {k.delta} vs sem. dernière
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Insight IA */}
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 p-2.5">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                <Sparkles className="size-2.5 text-violet-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-ink-primary">Insight IA</p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-ink-secondary">
                  Bonne progression cette semaine : votre taux de recommandation a augmenté de{' '}
                  <span className="font-semibold text-ink-primary">+5%</span> par rapport à vos
                  concurrents principaux.
                </p>
              </div>
            </div>

            {/* Opportunités / Part de Voix / Moteurs IA / Tonalité */}
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5">
                <p className="text-[10px] font-semibold text-ink-primary">Opportunités</p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="rounded-md bg-white/[0.03] p-1.5">
                    <p className="text-[8.5px] leading-tight text-ink-primary">
                      Renforcer les mentions RGPD
                    </p>
                    <p className="mt-0.5 text-[8px] font-medium text-warning">MOYENNE</p>
                  </div>
                  <div className="rounded-md bg-white/[0.03] p-1.5">
                    <p className="text-[8.5px] leading-tight text-ink-primary">
                      Se positionner face à Crisp
                    </p>
                    <p className="mt-0.5 text-[8px] font-medium text-ink-muted">FAIBLE</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5">
                <p className="text-[10px] font-semibold text-ink-primary">Part de Voix</p>
                <div className="mt-1.5 space-y-1.5">
                  {voice.map((v) => (
                    <div key={v.label}>
                      <div className="mb-0.5 flex items-center justify-between text-[8.5px] text-ink-secondary">
                        <span>{v.label}</span>
                        <span className="font-medium text-ink-primary">{v.value}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${v.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5">
                <p className="text-[10px] font-semibold text-ink-primary">Moteurs IA</p>
                <div className="mt-1.5 space-y-1.5">
                  {engines.map((e) => (
                    <div key={e.label}>
                      <div className="mb-0.5 flex items-center justify-between text-[8.5px] text-ink-secondary">
                        <span>{e.label}</span>
                        <span className="font-medium text-ink-primary">{e.value}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${e.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5">
                <p className="text-[10px] font-semibold text-ink-primary">Tonalité</p>
                <div className="mt-1.5 flex items-center justify-center">
                  <div
                    className="relative flex size-14 items-center justify-center rounded-full"
                    style={donutStyle}
                  >
                    <div className="flex size-10 flex-col items-center justify-center rounded-full bg-[#111114]">
                      <span className="text-[10px] font-bold text-ink-primary">{tone.positive}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[8px] text-ink-secondary">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-success" /> Positif {tone.positive}%
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-gray-500" /> Neutre {tone.neutral}%
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
