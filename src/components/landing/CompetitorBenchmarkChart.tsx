import { motion } from 'framer-motion'

// Reproduction animée du graphique de src/routes/dashboard/concurrents.tsx
// (barres verticales groupées Mentions/Recommandations) — données figées,
// s'anime au scroll (whileInView) plutôt qu'au chargement brut de la page,
// pour que l'animation soit vue même si la section arrive plus bas dans le scroll.

interface CompetitorData {
  name: string
  mentions: number
  recommendations: number
  isYou?: boolean
}

const data: CompetitorData[] = [
  { name: 'NovaPay', mentions: 63, recommendations: 38, isYou: true },
  { name: 'Qonto', mentions: 41, recommendations: 22 },
  { name: 'Shine', mentions: 28, recommendations: 14 },
]

const CHART_HEIGHT = 200

function Bar({ value, delay, colorClass }: { value: number; delay: number; colorClass: string }) {
  return (
    <div className="flex flex-col items-center justify-end" style={{ height: CHART_HEIGHT }}>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.55, duration: 0.3 }}
        className="mb-1.5 text-[11px] font-semibold text-ink-primary"
      >
        {value}%
      </motion.span>
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: `${(value / 100) * CHART_HEIGHT}px` }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`w-9 rounded-t-sm ${colorClass}`}
      />
    </div>
  )
}

export function CompetitorBenchmarkChart() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl shadow-black/40">
      <p className="mb-6 text-xs font-medium text-ink-muted">
        Présence dans les réponses observées
      </p>

      <div className="flex items-end justify-center gap-10 sm:gap-14">
        {data.map((competitor, i) => (
          <div key={competitor.name} className="flex flex-col items-center gap-3">
            <div className="flex items-end gap-2">
              <Bar value={competitor.mentions} delay={i * 0.15} colorClass="bg-brand" />
              <Bar value={competitor.recommendations} delay={i * 0.15 + 0.1} colorClass="bg-info" />
            </div>
            <span
              className={`text-xs font-medium ${
                competitor.isYou ? 'text-brand-text' : 'text-ink-secondary'
              }`}
            >
              {competitor.name}
              {competitor.isYou && <span className="ml-1 text-ink-muted">(vous)</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 border-t border-border/60 pt-5">
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="size-2.5 rounded-sm bg-brand" /> Mentions
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="size-2.5 rounded-sm bg-info" /> Recommandations
        </span>
      </div>
    </div>
  )
}
