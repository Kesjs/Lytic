import { Target, ThumbsUp, Trophy, Users } from 'lucide-react'
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { ScreenshotFrame } from './ScreenshotFrame'
import { Waterline } from './Waterline'

export function Metrics() {
  const { t } = useTranslation()

  const metricsData = [
    {
      icon: Target,
      ...t.metrics.items[0],
    },
    {
      icon: ThumbsUp,
      ...t.metrics.items[1],
    },
    {
      icon: Trophy,
      ...t.metrics.items[2],
    },
    {
      icon: Users,
      ...t.metrics.items[3],
    },
  ]

  return (
    <section id="metrics" className="bg-canvas px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-xl">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            {t.metrics.heading}
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            {t.metrics.subheading}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metricsData.map((m) => {
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

        <Waterline />

        {/* Benchmark Concurrentiel & Preuve réelle — même mesure, retournée
            vers un concurrent plutôt que vers vous. */}
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="font-display text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl">
            {t.metrics.benchmark.heading}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
            {t.metrics.benchmark.description}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <ScreenshotFrame
            label={t.metrics.benchmark.previewLabel}
            src="/images/dashboard/competitors.png"
            urlPath="app.reflet.io/dashboard/concurrents"
            glow
            badge={t.metrics.benchmark.previewBadge}
          />
        </div>
      </div>
    </section>
  )
}
