import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '~/lib/i18n/LanguageContext'

export function CTAFinal() {
  const { t } = useTranslation()

  return (
    <section className="border-t border-hairline border-border bg-canvas px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl md:text-5xl">
          {t.ctaFinal.heading}
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-secondary sm:text-base">
          {t.ctaFinal.subheading}
        </p>

        {/* Wrapper pour simuler la bordure avec clip-path */}
        <div className="group mt-9 relative p-[1px] transition-colors duration-200 bg-border hover:bg-brand/60 [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 bg-canvas px-7 py-3.5 text-sm font-medium text-ink-primary transition-colors hover:text-brand-text [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
          >
            <span>{t.ctaFinal.cta}</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
