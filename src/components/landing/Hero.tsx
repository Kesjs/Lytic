import { Link } from '@tanstack/react-router'
import { ArrowRight, Paperclip, Send } from 'lucide-react'

const results = [
  {
    rank: 1,
    name: 'Sage Business Cloud',
    description:
      "Idéal pour les entreprises en croissance, Sage offre une solution complète de facturation, de comptabilité et de gestion, avec une excellente sécurité des données.",
    visibility: 'Très visible',
    visibilityColor: 'text-green-700 bg-green-50 border-green-200',
    percent: '42%',
  },
  {
    rank: 2,
    name: 'Facture.net',
    description:
      "Simple et intuitif, c'est un bon choix pour les indépendants et les petites entreprises. Il permet de créer des factures rapidement et de suivre vos paiements en temps réel.",
    visibility: 'Visible',
    visibilityColor: 'text-blue-700 bg-blue-50 border-blue-200',
    percent: '28%',
  },
  {
    rank: 3,
    name: 'Zoho Books',
    description:
      "Une solution flexible et abordable, parfaite pour les freelances et les petites structures. Elle propose des fonctionnalités avancées comme la gestion des stocks et la synchronisation bancaire.",
    visibility: 'Moyennement visible',
    visibilityColor: 'text-violet-700 bg-violet-50 border-violet-200',
    percent: '18%',
  },
]

const legend = [
  { label: 'Sage Business Cloud', value: 42, color: '#22c55e' },
  { label: 'Facture.net', value: 28, color: '#3b82f6' },
  { label: 'Zoho Books', value: 18, color: '#8b5cf6' },
  { label: 'Autres', value: 12, color: '#a3a3a3' },
]

function DonutChart() {
  let acc = 0
  const stops = legend
    .map((d) => {
      const start = acc
      acc += d.value
      return `${d.color} ${start * 3.6}deg ${acc * 3.6}deg`
    })
    .join(', ')

  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative flex size-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-[10px] text-neutral-500">Visibilité</span>
          <span className="text-sm font-semibold text-neutral-900">100%</span>
        </div>
      </div>
    </div>
  )
}

function Sparkline() {
  return (
    <svg viewBox="0 0 100 30" className="mt-3 h-8 w-full">
      <polyline
        points="0,26 15,24 30,20 45,21 60,14 75,10 100,4"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-40">
      <div className="mx-auto grid max-w-1200 items-center gap-16 lg:grid-cols-[55%_45%]">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink-secondary">
            Visibilité IA
          </span>
          <h1 className="mt-6 text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            Voyez comment votre marque apparaît dans ChatGPT.
          </h1>
          <p className="mt-6 max-w-[520px] text-base leading-relaxed text-ink-secondary">
            Reflet pose les questions que vos prospects pourraient réellement poser, analyse les réponses générées par ChatGPT et vous montre où votre marque apparaît, qui apparaît à sa place et ce qui peut être amélioré.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover"
            >
              Analyser mon site
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#produit"
              className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm text-ink-primary transition-colors hover:border-border-strong"
            >
              Voir le produit
            </a>
          </div>
          <p className="mt-6 text-xs text-ink-muted">
            1 site, jusqu'à 30 questions, mesure continue
          </p>
        </div>

        {/* Real product card — white, per Factory's figure/ground move */}
        <div id="produit" className="rounded-xl border border-border bg-white p-5 shadow-2xl shadow-black/50">
          <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-8 shrink-0 rounded-full bg-neutral-200" />
                <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-2.5 text-sm text-neutral-800">
                  Quel est le meilleur logiciel de facturation en 2026 ?
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  AI
                </div>
                <div className="flex-1 space-y-2.5">
                  {results.map((r) => (
                    <div key={r.rank} className="rounded-lg border border-neutral-200 p-3">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
                          {r.rank}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{r.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pl-7">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${r.visibilityColor}`}>
                          {r.visibility}
                        </span>
                        <span className="text-[10px] font-medium text-neutral-500">{r.percent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5">
                <Paperclip className="size-4 text-neutral-400" />
                <span className="flex-1 text-sm text-neutral-400">Posez votre question...</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <Send className="size-3.5" />
                </span>
              </div>
            </div>

            <div className="space-y-4 border-t border-neutral-200 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <div>
                <p className="text-sm font-medium text-neutral-900">Visibilité des réponses</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Cette analyse montre comment votre contenu est perçu et cité par les utilisateurs.
                </p>
              </div>

              <DonutChart />

              <div className="space-y-1.5">
                {legend.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-neutral-600">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-medium text-neutral-900">{item.value}%</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <p className="text-xs font-medium text-neutral-900">Tendance</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                  La visibilité de Sage Business Cloud augmente de façon constante depuis 7 jours.
                </p>
                <Sparkline />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
