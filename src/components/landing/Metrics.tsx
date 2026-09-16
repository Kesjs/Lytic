import { Target, ThumbsUp, Trophy, Users } from 'lucide-react'
import { ScreenshotFrame } from './ScreenshotFrame'

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
                className="group flex flex-col rounded-xl border border-hairline border-border bg-surface p-6 transition-all duration-300 hover:border-brand/30 hover:bg-elevated hover:shadow-lg hover:shadow-black/20"
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-elevated border border-border text-ink-muted transition-colors group-hover:text-brand-text group-hover:border-brand/20">
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-ink-primary">{m.title}</h3>
                <p className="text-sm leading-relaxed text-ink-secondary">{m.body}</p>
              </div>
            )
          })}
        </div>

        {/* Benchmark Concurrentiel & Preuve réelle */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-text">Benchmark en conditions réelles</span>
          <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl">
            Comparez votre présence face à vos concurrents directs
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
            Chaque score remonte jusqu'à la question posée et la réponse brute de l'IA — observez vos écarts de mentions et de recommandations face aux alternatives du marché.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <ScreenshotFrame
            label="Benchmark concurrentiel — NovaPay vs Qonto"
            src="/images/dashboard/competitors.png"
            urlPath="app.reflet.io/dashboard/concurrents"
            glow
            badge="Benchmark vs Qonto"
          />
        </div>
      </div>
    </section>
  )
}
