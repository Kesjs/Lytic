import { BarChart3, TrendingUp, Building2, ShoppingBag, Briefcase } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

type Study = {
  sector: string
  icon: typeof Building2
  metricLabel: string
  metricValue: string
  summary: string
  detail: string
}

const studies: Study[] = [
  {
    sector: 'SaaS B2B — Analytics',
    icon: Building2,
    metricLabel: 'Part de visibilité IA sur ses questions clés',
    metricValue: '+38 %',
    summary:
      "En 6 semaines, après avoir restructuré ses pages de comparatif et autorisé les crawlers IA, l'outil apparaît désormais dans la majorité des réponses où seuls ses concurrents étaient cités.",
    detail:
      "Le diagnostic initial avait révélé un contenu pertinent mais mal structuré pour être repris tel quel dans une réponse générée.",
  },
  {
    sector: 'E-commerce — Mode',
    icon: ShoppingBag,
    metricLabel: 'Opportunités traitées sur le trimestre',
    metricValue: '24',
    summary:
      "Le suivi a mis en évidence des questions produit fréquentes auxquelles le site ne répondait pas explicitement. Une fois les pages FAQ enrichies, le taux de citation sur ces questions a nettement progressé.",
    detail: "Priorisation faite sur les opportunités à fort volume de questions plutôt que sur l'exhaustivité.",
  },
  {
    sector: 'Cabinet de conseil',
    icon: Briefcase,
    metricLabel: 'Position moyenne dans les réponses IA',
    metricValue: '4ᵉ → 2ᵉ',
    summary:
      "Sans changer d'offre, le cabinet a clarifié son positionnement sur son site pour qu'il corresponde à la façon dont les IA reformulent les besoins de ses prospects — gagnant deux places en position moyenne.",
    detail: "L'écart identifié portait sur la formulation, pas sur le fond de l'offre elle-même.",
  },
]

export const Route = createFileRoute('/etudes')({
  component: EtudesPage,
})

function EtudesPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-ink-muted">
            <BarChart3 className="size-6" />
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Études
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            Des exemples illustratifs de ce que révèle un suivi de visibilité IA, et des actions qui en découlent —
            secteurs et volumétries anonymisés à titre d'illustration.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {studies.map((study) => {
            const Icon = study.icon
            return (
              <div
                key={study.sector}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-elevated hover:shadow-xl hover:shadow-brand/10"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated text-ink-muted">
                  <Icon className="size-5" />
                </div>

                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{study.sector}</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-brand-text">{study.metricValue}</span>
                  <TrendingUp className="size-4 text-brand-text" />
                </div>
                <p className="mt-1 text-xs text-ink-muted">{study.metricLabel}</p>

                <p className="mt-4 flex-1 text-sm text-ink-secondary">{study.summary}</p>

                <p className="mt-4 border-t border-border/60 pt-4 text-xs text-ink-muted">{study.detail}</p>
              </div>
            )
          })}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-ink-muted">
          Vous voulez le même diagnostic pour votre site ?{' '}
          <a href="/#tarifs" className="font-medium text-ink-secondary underline underline-offset-4 hover:text-ink-primary">
            Voir les plans
          </a>
        </p>
      </section>

      <Footer />
    </main>
  )
}
