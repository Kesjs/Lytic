import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Sparkles, Building2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslation } from '~/lib/i18n/LanguageContext'

type Feature = { label: string; detail?: string }

const featuresFree: Feature[] = [
  { label: '1 site suivi' },
  { label: '1 question suivie' },
  { label: '1 mesure (aperçu unique)' },
  { label: 'Score + 1 concurrent visible' },
  {
    label: 'Accès Bots IA',
    detail: 'Autorisation de crawl pour GPTBot, ClaudeBot et PerplexityBot sur votre contenu indexable.',
  },
]

const featuresPro: Feature[] = [
  { label: '1 site suivi' },
  { label: "Jusqu'à 50 questions" },
  {
    label: 'Mesure continue automatique',
    detail: 'Vérification automatique de votre visibilité une fois par semaine, sans action de votre part.',
  },
  { label: 'Interrogation de ChatGPT' },
  { label: 'Analyse de positionnement' },
  { label: 'Détection des opportunités' },
]

const featuresEnterprise: Feature[] = [
  { label: 'Multi-sites & multi-marques' },
  { label: 'Questions illimitées' },
  { label: 'Accès API complet' },
  { label: 'Multi-moteurs IA (sur roadmap)' },
  { label: 'Support dédié (Slack/Email)' },
  {
    label: 'SSO & SLA garantis',
    detail: 'Connexion unique (SSO/SAML) et engagement contractuel de disponibilité (SLA), avec support prioritaire.',
  },
]

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <li className="flex items-start gap-3 text-sm text-ink-secondary">
      <Check className="mt-0.5 size-4 shrink-0 text-ink-muted" />
      {feature.detail ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default underline decoration-ink-muted/50 decoration-dotted underline-offset-4">
              {feature.label}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px] text-left">{feature.detail}</TooltipContent>
        </Tooltip>
      ) : (
        feature.label
      )}
    </li>
  )
}

export function Pricing() {
  const { t } = useTranslation()
  const [annual, setAnnual] = useState(false)

  return (
    <section id="tarifs" className="bg-canvas px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            {t.pricing.heading}
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            {t.pricing.subheading}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="relative flex items-center rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`relative z-10 w-28 rounded-full py-1.5 text-sm font-medium transition-colors ${
                !annual ? 'text-black' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`relative z-10 w-28 rounded-full py-1.5 text-sm font-medium transition-colors ${
                annual ? 'text-black' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t.pricing.annual}
            </button>
            <div
              className={`absolute left-1 top-1 h-[calc(100%-8px)] w-28 rounded-full bg-brand transition-transform duration-300 ease-in-out ${
                annual ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-6xl lg:grid-cols-3 lg:gap-8">
          {/* Free Plan */}
          <div className="flex flex-col rounded-xl border border-hairline border-border bg-surface p-8 transition-colors hover:border-border-strong hover:bg-elevated">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-semibold text-ink-primary">{t.pricing.free.name}</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                {t.pricing.free.description}
              </p>
            </div>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight text-ink-primary">{t.pricing.free.price}</span>
            </div>
            <p className="mb-6 text-sm text-ink-muted">{t.pricing.free.noCard}</p>

            <ul className="mb-8 flex-1 space-y-4">
              {t.pricing.free.features.map((feature) => (
                <FeatureItem key={feature.label} feature={feature} />
              ))}
            </ul>

            <Link
              to="/signup"
              className="mt-auto flex w-full items-center justify-center rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-ink-primary transition-all hover:border-border-strong hover:bg-elevated"
            >
              {t.pricing.free.cta}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative flex flex-col rounded-xl border border-brand/50 bg-surface p-8 shadow-2xl shadow-brand/10 ring-1 ring-brand/50">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                <Sparkles className="size-3.5" /> {t.pricing.pro.recommended}
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="font-display text-2xl font-semibold text-ink-primary">{t.pricing.pro.name}</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                {t.pricing.pro.description}
              </p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight text-ink-primary">
                {annual ? t.pricing.pro.priceAnnual : t.pricing.pro.priceMonthly}
              </span>
              <span className="text-sm font-medium text-ink-muted">{t.pricing.pro.perMonth}</span>
            </div>
            {annual && (
              <p className="mb-6 text-sm text-success">{t.pricing.pro.billedAnnually}</p>
            )}

            <ul className="mb-8 flex-1 space-y-4">
              {t.pricing.pro.features.map((feature) => (
                <FeatureItem key={feature.label} feature={feature} />
              ))}
            </ul>

            <Link
              to="/login"
              className="mt-auto flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-black transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20"
            >
              {t.pricing.pro.cta}
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col rounded-xl border border-hairline border-border bg-surface p-8 transition-colors hover:border-border-strong hover:bg-elevated">
            <div className="mb-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-hairline border-border bg-elevated text-ink-primary">
                <Building2 className="size-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink-primary">{t.pricing.enterprise.name}</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                {t.pricing.enterprise.description}
              </p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tracking-tight text-ink-primary">
                {t.pricing.enterprise.price}
              </span>
            </div>

            <ul className="mb-8 flex-1 space-y-4">
              {t.pricing.enterprise.features.map((feature) => (
                <FeatureItem key={feature.label} feature={feature} />
              ))}
            </ul>

            <a
              href="mailto:contact@reflet.ai"
              className="mt-auto flex w-full items-center justify-center rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-ink-primary transition-all hover:border-border-strong hover:bg-elevated"
            >
              {t.pricing.enterprise.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
