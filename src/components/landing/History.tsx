import { useTranslation } from '~/lib/i18n/LanguageContext'
import { ScreenshotFrame } from './ScreenshotFrame'

// Sparkline dérivée de deux mesures réelles (64 → 68) — reste un vrai petit
// graphique, pas une recréation d'UI, donc pas concerné par le remplacement
// en capture d'écran ci-dessous.
function ScoreSparkline() {
  return (
    <svg viewBox="0 0 200 56" className="h-14 w-full" aria-hidden="true">
      <polyline
        points="4,40 68,42 132,36 196,12"
        fill="none"
        stroke="rgb(var(--color-brand))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="40" r="3" fill="rgb(var(--color-brand))" />
      <circle cx="196" cy="12" r="3" fill="rgb(var(--color-brand))" />
      <text x="0" y="54" className="fill-ink-muted text-[10px]">64</text>
      <text x="184" y="26" className="fill-ink-muted text-[10px]">68</text>
    </svg>
  )
}

export function History() {
  const { t } = useTranslation()

  return (
    <section id="historique" className="border-t border-hairline border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-brand-text">{t.history.tag}</span>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl">
            {t.history.heading}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
            {t.history.description}
          </p>
          <div className="mt-6 max-w-xs rounded-md border border-hairline border-border bg-surface p-4">
            <ScoreSparkline />
          </div>
        </div>
        <ScreenshotFrame
          label={t.history.previewLabel}
          src="/images/dashboard/history.png"
          urlPath="app.reflet.io/dashboard/historique"
          aspect="aspect-auto"
          glow
          badge={t.history.previewBadge}
        />
      </div>
    </section>
  )
}
