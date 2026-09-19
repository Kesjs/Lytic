import {
  GraduationCap,
  Compass,
  Bot,
  ShieldCheck,
  Radar,
  Lightbulb,
  Layers,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

type Guide = {
  title: string
  description: string
  readTime: string
  icon: typeof Bot
}

type Category = {
  label: string
  guides: Guide[]
}

const categories: Category[] = [
  {
    label: 'Démarrage',
    guides: [
      {
        title: "Configurer votre premier site suivi",
        description:
          "Ajouter votre domaine, choisir vos premières questions à suivre, et comprendre ce que mesure votre score initial.",
        readTime: '5 min',
        icon: Compass,
      },
      {
        title: 'Autoriser les bots IA sur votre site',
        description:
          "Vérifier et ajuster votre robots.txt pour GPTBot, ClaudeBot et PerplexityBot, sans ouvrir plus que nécessaire.",
        readTime: '4 min',
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: 'Optimisation',
    guides: [
      {
        title: 'Choisir les bonnes questions à suivre',
        description:
          "Toutes les questions ne se valent pas : privilégier celles qui reflètent une vraie intention d'achat ou de comparaison.",
        readTime: '6 min',
        icon: Bot,
      },
      {
        title: 'Comprendre et prioriser vos opportunités',
        description:
          "Chaque opportunité détectée pointe un écart entre une réponse IA et votre contenu réel. Comment les trier par impact.",
        readTime: '7 min',
        icon: Lightbulb,
      },
      {
        title: 'Structurer une page pour être citée par une IA',
        description:
          "Formuler une réponse claire, une donnée vérifiable et une structure lisible par une IA autant que par un humain.",
        readTime: '8 min',
        icon: Layers,
      },
    ],
  },
  {
    label: 'Avancé',
    guides: [
      {
        title: 'Interpréter le score de visibilité dans la durée',
        description:
          "Un score doit se lire en tendance, pas en instantané. Distinguer une variation normale d'un vrai signal.",
        readTime: '6 min',
        icon: Radar,
      },
      {
        title: 'Analyser votre positionnement face aux concurrents',
        description:
          "Comparer votre part de visibilité IA à celle de vos concurrents suivis, question par question.",
        readTime: '7 min',
        icon: GraduationCap,
      },
    ],
  },
]

export const Route = createFileRoute('/guides')({
  component: GuidesPage,
})

function GuidesPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-ink-muted">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Guides
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            Des guides pratiques pour configurer, comprendre et exploiter votre visibilité dans les réponses IA, du
            premier réglage jusqu'à l'analyse concurrentielle.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl space-y-16">
          {categories.map((category) => (
            <div key={category.label}>
              <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                {category.label}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {category.guides.map((guide) => {
                  const Icon = guide.icon
                  return (
                    <div
                      key={guide.title}
                      className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-elevated hover:shadow-lg hover:shadow-brand/10"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-ink-muted transition-colors group-hover:text-brand-text group-hover:border-brand/20">
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-base font-semibold text-ink-primary">{guide.title}</h3>
                        <p className="mt-1.5 text-sm text-ink-secondary">{guide.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <Clock className="size-3.5" /> {guide.readTime}
                          </span>
                          <ArrowUpRight className="size-4 text-ink-muted transition-colors group-hover:text-ink-primary" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
