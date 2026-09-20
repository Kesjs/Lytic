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
        <div className="group mt-10 relative p-[1px] transition-colors duration-300 bg-border hover:bg-brand/60 [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] shadow-xl shadow-brand/5 hover:shadow-brand/20">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 bg-canvas px-8 py-4 text-sm font-medium text-ink-primary transition-colors hover:text-brand-text [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
          >
            <span>{t.ctaFinal.cta}</span>
            <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Logos des LLMs interrogés en couleur */}
        <div className="mt-16 flex flex-col items-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-ink-muted mb-6">
            {t.ctaFinal.models}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-90">
            <img src="https://svgl.app/library/chatgpt.svg" alt="ChatGPT" className="h-7 w-auto drop-shadow-sm" />
            <img src="https://svgl.app/library/gemini.svg" alt="Google Gemini" className="h-7 w-auto drop-shadow-sm" />
            <img src="https://svgl.app/library/perplexity.svg" alt="Perplexity AI" className="h-7 w-auto drop-shadow-sm" />
            <img src="https://svgl.app/library/copilot.svg" alt="Microsoft Copilot" className="h-7 w-auto drop-shadow-sm" />
          </div>
        </div>
      </div>
    </section>
  )
}
