import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Sparkles, Globe } from 'lucide-react'
import { useState, type ReactNode } from 'react'
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
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (domain.trim()) {
      localStorage.setItem('reflet_onboarding_domain', domain.trim())
    }
    navigate({ to: primaryCta.to })
  }

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
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
      {/* Background : Architectural Grid & Soft Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)' }}
        />
        {/* Glow behind the dashboard (moved down slightly) */}
        <div className="absolute top-[40%] w-[800px] h-[500px] bg-brand/15 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[45%] w-[600px] h-[400px] bg-violet-400/10 blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      {/* Hero Content */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-4xl px-6 flex flex-col items-center text-center"
      >
        {/* Pill Eyebrow */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="mb-6 inline-flex items-center rounded-full border border-border bg-surface/50 px-3 py-1.5 text-sm font-medium text-ink-secondary backdrop-blur-md transition-colors shadow-sm"
        >
          <span className="text-ink-primary">{eyebrow}</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink-primary sm:text-6xl lg:text-[70px] text-balance"
        >
          {t.hero.title.part1}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand/90 to-[#b59918]">
            {t.hero.title.highlight}
          </span>
          {t.hero.title.part2}
        </motion.h1>

        {/* Description */}
        <motion.p 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary sm:text-xl font-light text-balance"
        >
          {t.hero.description}
        </motion.p>

        {/* CTAs */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="mt-8 flex flex-col items-center justify-center gap-4 w-full sm:w-auto"
        >
          <form 
            onSubmit={handleAnalyze} 
            className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto"
          >
            <div className="flex w-full sm:w-[340px] overflow-hidden rounded-md border border-border bg-surface shadow-sm focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50 transition-colors">
              <div className="flex items-center justify-center border-r border-border bg-surface/50 px-4">
                <Globe className="size-4.5 text-ink-muted" />
              </div>
              <input 
                type="text" 
                placeholder="tondomaine.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-transparent py-3.5 pl-3 pr-4 text-base text-ink-primary outline-none"
                required
              />
            </div>
            {/* Primary CTA */}
            <button
              type="submit"
              className="group relative flex shrink-0 w-full sm:w-[340px] items-center justify-center gap-2 overflow-hidden bg-brand px-8 py-3.5 text-base font-medium text-black transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,171,30,0.45)] active:scale-[0.98] [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
            >
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                aria-hidden="true"
              />
              <span className="relative z-10 whitespace-nowrap">{t.hero.primaryCta}</span>
              <ArrowRight className="relative z-10 size-4.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </form>
        </motion.div>

        {/* Reassurance */}
        <motion.p 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
          className="mt-4 text-sm text-ink-muted flex items-center justify-center gap-2"
        >
          {t.hero.freeToStart}
        </motion.p>
      </motion.div>

      {/* Animated AI Cycle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 mx-auto mt-16 flex w-full max-w-4xl justify-center px-6"
      >
        <AiCycle engines={engines} />
      </motion.div>

      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        id="produit"
        className="relative z-10 mx-auto mt-12 mb-28 sm:mb-36 w-full max-w-1200 px-4 sm:px-6"
      >
        {defaultPreview}
      </motion.div>
    </section>
  )
}
