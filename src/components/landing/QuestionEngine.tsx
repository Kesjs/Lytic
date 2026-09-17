import { useTranslation } from '~/lib/i18n/LanguageContext'

export function QuestionEngine() {
  const { t } = useTranslation()

  return (
    <section id="questions" className="border-t border-hairline border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-ink-primary">
            {t.questionEngine.heading}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
            {t.questionEngine.description}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border border-hairline border-danger/30 bg-danger/5 px-4 py-3">
            <span className="text-sm text-danger">✕</span>
            <span className="text-sm text-ink-secondary">{t.questionEngine.badExample}</span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-hairline border-success/30 bg-success/5 px-4 py-3">
            <span className="text-sm text-success">✓</span>
            <span className="text-sm text-ink-primary">{t.questionEngine.goodExample}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
