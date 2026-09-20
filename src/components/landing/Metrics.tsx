import { Target, ThumbsUp, Trophy, Users } from 'lucide-react'
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { CompetitorBenchmarkChart } from './CompetitorBenchmarkChart'
import { motion } from 'framer-motion'

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
          {metricsData.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                className="group relative flex flex-col rounded-3xl border border-border/60 bg-surface/40 p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-brand/30 hover:bg-surface/80 hover:shadow-[0_15px_30px_-10px_rgba(201,171,30,0.15)] overflow-hidden"
              >
                {/* Subtle background glow on hover */}
                <div className="absolute -right-12 -top-12 size-32 rounded-full bg-brand/5 blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none" />
                
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 text-brand ring-4 ring-canvas shadow-inner shadow-brand/10 transition-all duration-500 group-hover:bg-brand group-hover:text-black group-hover:shadow-[0_0_20px_rgba(201,171,30,0.4)] group-hover:scale-110">
                  <Icon className="size-6" strokeWidth={2.5} />
                </div>
                <h3 className="mb-3 text-lg font-bold text-ink-primary tracking-tight">{m.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-secondary">{m.body}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Benchmark Concurrentiel — Graphique à gauche, texte à droite */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-brand/10 blur-[100px] rounded-full scale-90 -z-10" />
              <CompetitorBenchmarkChart />
            </div>
            <div className="lg:col-span-6">
              <h3 className="font-display text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl">
                {t.metrics.benchmark.heading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                {t.metrics.benchmark.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
