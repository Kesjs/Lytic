import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { AiCycle } from './AiCycle'
import { DashboardPreview } from './DashboardPreview'

export interface HeroProps {
  eyebrow?: string
  title?: ReactNode
  description?: string
  primaryCta?: { label: string; to: string }
  secondaryCta?: { label: string; href: string }
  engines?: string[]
  preview?: ReactNode
}

export function Hero({
  eyebrow = 'Visibilité IA',
  title = (
    <>
      Voyez comment les <span className="text-brand-text">IA</span> parlent de votre marque.
    </>
  ),
  description = "Reflet mesure votre visibilité dans les réponses des IA, compare votre position à la concurrence, et transforme chaque écart en action concrète.",
  primaryCta = { label: 'Analyser mon site', to: '/login' },
  secondaryCta = { label: 'Voir le produit', href: '#produit' },
  engines,
  preview = <DashboardPreview />,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-40">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1 text-xs text-ink-secondary">
          {eyebrow}
        </span>

        <h1 className="mt-6 text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
          {title}
        </h1>

        <AiCycle engines={engines} />

        <p className="mx-auto mt-6 max-w-[520px] text-base leading-relaxed text-ink-secondary">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={primaryCta.to}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-brand-hover"
          >
            {primaryCta.label}
            <ArrowRight className="size-4" />
          </Link>
          
          <a
            href={secondaryCta.href}
            className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm text-ink-primary transition-colors hover:border-border-strong"
          >
            {secondaryCta.label}
          </a>
        </div>

        <p className="mt-6 text-xs text-ink-muted">1 site, jusqu'à 30 questions, mesure continue</p>
      </div>

      <div id="produit" className="mx-auto mt-16 max-w-1200">
        {preview}
      </div>
    </section>
  )
}
