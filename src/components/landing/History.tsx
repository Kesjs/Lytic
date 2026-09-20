import { useTranslation } from '~/lib/i18n/LanguageContext'
import { HistoryFeedPreview } from './HistoryFeedPreview'
import { BellRing, ArrowUpRight } from 'lucide-react'

function DetectionAlert() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-br from-surface to-brand/5 p-4 shadow-xl shadow-brand/5 transition-all duration-300 hover:border-brand/40 hover:shadow-brand/10 hover:-translate-y-0.5">
      {/* Glow background */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-brand/10 blur-2xl pointer-events-none" />
      
      <div className="flex items-start gap-4">
        <div className="relative mt-0.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand/20 text-brand ring-1 ring-brand/30 shadow-inner shadow-white/10">
            <BellRing className="size-4" strokeWidth={2.5} />
          </div>
          {/* Indicateur d'alerte (pulsant) */}
          <div className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-brand ring-2 ring-surface">
            <div className="absolute inset-0 rounded-full bg-brand animate-ping opacity-75" />
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand mb-1">
            Changement détecté
          </p>
          <p className="text-[13px] font-medium text-ink-primary leading-relaxed">
            NovaPay est maintenant recommandé sur "Meilleur compte pro".
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-1 text-xs font-bold text-success border border-success/30">
              <ArrowUpRight className="size-3" strokeWidth={3} />
              Impact : +4 pts
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function History() {
  const { t } = useTranslation()

  return (
    <section id="historique" className="border-t border-hairline border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl">
            {t.history.heading}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
            {t.history.description}
          </p>
          <div className="mt-8 max-w-sm">
            <DetectionAlert />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-brand/10 blur-[100px] rounded-full scale-90 -z-10" />
          <HistoryFeedPreview />
        </div>
      </div>
    </section>
  )
}
