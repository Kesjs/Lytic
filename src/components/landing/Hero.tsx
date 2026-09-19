import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { AiCycle } from './AiCycle'
import { ScreenshotFrame } from './ScreenshotFrame'

import type { AiEngine } from './AiCycle'

export interface HeroProps {
  eyebrow?: string
  title?: ReactNode
  description?: string
  primaryCta?: { label: string; to: string }
  secondaryCta?: { label: string; href: string }
  engines?: AiEngine[]
  preview?: ReactNode
}

export function Hero({
  eyebrow = 'Testez votre marque',
  title,
  description,
  primaryCta = { label: 'Analyser mon site', to: '/login' },
  secondaryCta = { label: 'Voir le produit', href: '#produit' },
  engines,
}: HeroProps) {
  const { t } = useTranslation()

  const defaultPreview = (
    <ScreenshotFrame
      label={t.hero.previewLabel}
      src="/images/dashboard/overview.png"
      urlPath="app.reflet.io/dashboard"
      glow
      fadeBottom
      annotation={t.hero.previewAnnotation}
      badge={t.hero.previewBadge}
    />
  )

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
      {/* Contenu textuel Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-1200 px-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 lg:gap-8">
          
          {/* Colonne de gauche : Texte */}
          <div className="flex max-w-3xl flex-col items-start text-left flex-1">
            {/* Pill Eyebrow */}
            <div className="mb-8 inline-flex items-center rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-sm font-medium text-ink-secondary backdrop-blur-md transition-colors hover:bg-white/10">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(201,171,30,0.8)]"></span>
              <span className="text-white/60 mr-2">Nouveau ?</span>
              <span className="text-white">{eyebrow}</span>
            </div>

            {/* Titre principal */}
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink-primary sm:text-5xl lg:text-6xl text-balance">
              {t.hero.title.part1}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand/90 to-[#b59918]">
                {t.hero.title.highlight}
              </span>
              {t.hero.title.part2}
            </h1>

            {/* Paragraphe descriptif */}
            <p className="mt-6 max-w-[560px] text-base leading-relaxed text-ink-secondary sm:text-lg lg:text-xl font-light">
              {t.hero.description}
            </p>
          </div>

          {/* Colonne de droite : Boutons et Stats */}
          <div className="flex flex-col items-start lg:items-end flex-shrink-0 lg:pb-2">
            <div className="flex flex-wrap items-center gap-4">
              {/* Bouton Shimmer CTA animé */}
              <Link
                to={primaryCta.to}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden bg-brand px-7 py-3.5 text-sm font-medium text-black transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,171,30,0.45)] active:scale-[0.98] [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative z-10">{t.hero.primaryCta}</span>
                <ArrowRight className="relative z-10 size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              {/* Bouton secondaire sleek glassmorphic avec contour hexagonal */}
              <div className="group relative p-[1px] transition-all duration-300 bg-white/10 hover:bg-white/20 [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
                <a
                  href={secondaryCta.href}
                  className="inline-flex items-center bg-surface/50 px-6 py-3.5 text-sm font-medium text-ink-primary backdrop-blur-md transition-all duration-300 group-hover:bg-surface group-hover:text-white [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
                >
                  {t.hero.secondaryCta}
                  <ArrowRight className="ml-2 size-4 text-ink-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white" />
                </a>
              </div>
            </div>

            {/* Mention rassurante (Stats) */}
            <p className="mt-5 text-sm text-ink-muted flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
              {t.hero.freeToStart}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cycle des IA animées (déplacé au centre entre le texte et la preview) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="relative z-10 mx-auto mt-16 flex w-full max-w-1200 justify-center px-6"
      >
        <AiCycle engines={engines} />
      </motion.div>

      {/* Aperçu du produit avec espace de respiration en bas */}
      <div
        id="produit"
        className="relative z-10 mx-auto mt-16 mb-28 sm:mb-36 w-full max-w-1200 px-4 sm:px-6"
      >
        {defaultPreview}
      </div>
    </section>
  )
}
