import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AiCycle } from './AiCycle'
import { DashboardPreview } from './DashboardPreview'

import { GrainGradientShader } from '../shared/grain-gradient-shader'

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
  eyebrow = 'Soyez recommandé par les IA',
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
    <section className="relative overflow-hidden px-6 pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Background Texture avec fondu progressif */}
      <div
        className="pointer-events-none absolute inset-0 z-0 select-none opacity-60"
        style={{
          maskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 35%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 35%, transparent 95%)',
        }}
        aria-hidden="true"
      >
        <GrainGradientShader className="w-full h-full" />
      </div>

      {/* Contenu textuel Hero : parfaitement centré au chargement */}
      <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center justify-center">
        {/* Badge animé style 21st.dev avec point pulsant et glow */}
        <motion.div
          initial={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="group relative inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-surface/70 px-4 py-1.5 text-xs font-medium text-ink-primary shadow-lg backdrop-blur-md transition-all duration-300 hover:border-brand/50 hover:bg-surface">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-ink-secondary">{eyebrow}</span>
            <span className="text-border-strong">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-text">
              <Sparkles className="size-3 text-brand" />
              <span>Nouveauté</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </motion.div>

        {/* Titre principal avec apparition en fondu et léger flou cinématique (21st.dev blur-in) */}
        <motion.h1
          initial={{ opacity: 0, y: 22, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink-primary sm:text-6xl md:text-[68px]"
        >
          {title}
        </motion.h1>

        {/* Cycle des IA animées */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2"
        >
          <AiCycle engines={engines} />
        </motion.div>

        {/* Paragraphe descriptif avec apparition progressive */}
        <motion.p
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-[560px] text-base leading-relaxed text-ink-secondary sm:text-lg"
        >
          {description}
        </motion.p>

        {/* Boutons d'action avec effet shimmer 21st.dev sur le CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
        >
          {/* Bouton Shimmer CTA animé */}
          <Link
            to={primaryCta.to}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,171,30,0.45)] active:scale-[0.98]"
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
            className="inline-flex items-center rounded-lg border border-border/80 bg-surface/50 px-5 py-3.5 text-sm font-medium text-ink-primary backdrop-blur-md transition-all duration-300 hover:border-brand/40 hover:bg-surface hover:text-white"
          >
            {secondaryCta.label}
          </a>
        </motion.div>

        {/* Mention rassurante */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-xs text-ink-muted"
        >
          1 site, jusqu'à 30 questions, mesure continue
        </motion.p>
      </div>

      {/* Aperçu du produit avec apparition fluide */}
      <motion.div
        id="produit"
        initial={{ opacity: 0, y: 45, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.85, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mt-20 w-full max-w-1200"
      >
        {preview}
      </motion.div>
    </section>
  )
}
