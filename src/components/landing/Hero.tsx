import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  eyebrow = 'Nouveau : le plan Free est disponible',
  title = (
    <>
      Voyez comment les <span className="text-brand-text">IA</span> parlent de votre marque.
    </>
  ),
  description = "Reflet mesure votre visibilité dans les réponses des IA, compare votre position à la concurrence, et transforme chaque écart en action concrète.",
  primaryCta = { label: 'Analyser mon site', to: '/login' },
  secondaryCta = { label: 'Voir le produit', href: '#produit' },
  engines,
  preview = (
    <ScreenshotFrame
      label="Dashboard Reflet — Vue d'ensemble"
      src="/images/dashboard/overview.png"
      urlPath="app.reflet.io/dashboard/accueil"
      glow
      fadeBottom
    />
  ),
}: HeroProps) {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const y = useTransform(scrollY, [0, 400], [0, 60])

  return (
    <section className="relative overflow-hidden">
      {/* Halo d'ambiance ultra-fluide en CSS pur (GPU accéléré, 0 lag) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[500px] w-[850px] max-w-full rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,171,30,0.18)_0%,rgba(201,171,30,0.03)_50%,transparent_75%)] blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      </div>

      {/* Contenu textuel Hero : parfaitement centré au chargement dans la hauteur de l'écran */}
      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-4xl flex-col items-center justify-center px-6 pt-20">
        <motion.div style={{ opacity, y }} className="flex flex-col items-center text-center">


        {/* Badge d'annonce, façon pill — relié au plan Free */}
        <motion.a
          href="#tarifs"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/60 px-4 py-1.5 text-xs text-ink-secondary backdrop-blur-md transition-colors hover:border-brand/40"
        >
          <Sparkles className="size-3.5 text-brand-text" />
          {eyebrow}
          <span className="inline-flex items-center gap-1 text-brand-text">
            En savoir plus
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </motion.a>

        {/* Titre principal avec apparition en fondu */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 font-display text-4xl font-medium leading-[1.08] tracking-tight text-ink-primary sm:text-6xl md:text-[68px]"
        >
          {title}
        </motion.h1>

        {/* Cycle des IA animées */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2"
        >
          <AiCycle engines={engines} />
        </motion.div>

        {/* Paragraphe descriptif avec apparition progressive */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-[560px] text-base leading-relaxed text-ink-secondary sm:text-lg"
        >
          {description}
        </motion.p>

        {/* Boutons d'action avec effet shimmer sur le CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
        >
          {/* Bouton Shimmer CTA animé */}
          <Link
            to={primaryCta.to}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md bg-brand px-6 py-3.5 text-sm font-medium text-black transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,171,30,0.45)] active:scale-[0.98]"
          >
            {/* Rayon de lumière shimmer traversant */}
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
              aria-hidden="true"
            />
            <span className="relative z-10">{primaryCta.label}</span>
            <ArrowRight className="relative z-10 size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Bouton secondaire sleek glassmorphic */}
          <a
            href={secondaryCta.href}
            className="inline-flex items-center rounded-md border border-hairline border-border/80 bg-surface/50 px-5 py-3.5 text-sm font-medium text-ink-primary backdrop-blur-md transition-all duration-300 hover:border-brand/40 hover:bg-surface hover:text-white"
          >
            {secondaryCta.label}
          </a>
        </motion.div>

        {/* Mention rassurante */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-xs text-ink-muted"
        >
          Gratuit pour commencer. Sans carte bancaire.
        </motion.p>
      </motion.div>
      </div>

      {/* Aperçu du produit avec apparition fluide et espace de respiration en bas */}
      <motion.div
        id="produit"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mt-16 mb-28 sm:mb-36 w-full max-w-1200 px-4 sm:px-6"
      >
        {preview}
      </motion.div>
    </section>
  )
}
