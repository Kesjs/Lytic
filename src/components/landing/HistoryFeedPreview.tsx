import { motion } from 'framer-motion'

// Reproduction du flux "Historique" (voir src/routes/dashboard/historique.tsx) —
// mêmes libellés et données que le screenshot d'origine, apparition en
// cascade au scroll, sans sidebar ni chrome de fenêtre.

const events = [
  {
    type: 'mention',
    badge: 'info',
    title: 'Nouvelle mention',
    date: '16 sept. 2026, 18:43',
    detail: 'NovaPay est maintenant recommandé par ChatGPT sur "Meilleur compte pro".',
  },
  {
    type: 'measure',
    title: 'Mesure terminée',
    date: '9 sept. 2026, 18:42',
    detail: '4/4 questions',
    score: '72 (+8)',
  },
  {
    type: 'measure',
    title: 'Mesure terminée',
    date: '2 sept. 2026, 18:42',
    detail: '4/4 questions',
    score: '64 (+2)',
  },
]

export function HistoryFeedPreview() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 divide-y divide-border/60 overflow-hidden text-left">
      {events.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.4, ease: 'easeOut' }}
          className="p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {event.badge && (
                <span className="rounded-sm border border-info/30 bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
                  {event.badge}
                </span>
              )}
              <span className="text-sm font-medium text-ink-primary">{event.title}</span>
            </div>
            <span className="text-[11px] text-ink-muted">{event.date}</span>
          </div>

          {event.type === 'mention' ? (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{event.detail}</p>
          ) : (
            <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-secondary">
              <span>{event.detail}</span>
              <span className="text-ink-muted">·</span>
              <span>
                Score <span className="font-medium text-brand-text">{event.score}</span>
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
