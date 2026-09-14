import { Target, ThumbsUp, Trophy, Users } from 'lucide-react'

const metrics = [
  {
    icon: Target,
    title: 'Présence',
    body: 'Votre marque est-elle mentionnée dans les réponses des IA ?',
  },
  {
    icon: ThumbsUp,
    title: 'Recommandation',
    body: 'Est-elle proposée comme la solution idéale ou de manière neutre ?',
  },
  {
    icon: Trophy,
    title: 'Positionnement',
    body: 'Où apparaît-elle lorsqu’une liste de solutions est générée ?',
  },
  {
    icon: Users,
    title: 'Concurrence',
    body: 'Quels concurrents apparaissent à votre place ou plus fréquemment ?',
  },
]

export function Metrics() {
  return (
    <section className="bg-canvas px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Ce que Reflet mesure
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Les 4 piliers de votre visibilité au sein des grands modèles de langage.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.title}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-brand/30 hover:bg-elevated hover:shadow-lg hover:shadow-black/20"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated border border-border text-ink-muted transition-colors group-hover:text-brand-text group-hover:border-brand/20">
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-ink-primary">{m.title}</h3>
                <p className="text-sm leading-relaxed text-ink-secondary">{m.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
