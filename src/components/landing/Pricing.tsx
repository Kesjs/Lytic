import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Sparkles, Building2 } from 'lucide-react'

const featuresFree = [
  '1 site suivi',
  '1 question suivie',
  '1 mesure (aperçu unique)',
  'Score + 1 concurrent visible',
  'Accès Bots IA',
]

const featuresPro = [
  '1 site suivi',
  "Jusqu'à 30 questions",
  'Mesure continue automatique',
  'Interrogation de ChatGPT',
  'Analyse de positionnement',
  'Détection des opportunités'
]

const featuresEnterprise = [
  'Multi-sites & multi-marques',
  'Questions illimitées',
  'Accès API complet',
  'Multi-modèles (ChatGPT, Perplexity, Claude)',
  'Support dédié (Slack/Email)',
  'SSO & SLA garantis'
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="tarifs" className="bg-canvas px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Un tarif simple, sans surprise
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Commencez à mesurer votre impact réel sur l'IA dès aujourd'hui.
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
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`relative z-10 w-28 rounded-full py-1.5 text-sm font-medium transition-colors ${
                annual ? 'text-black' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Annuel
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
              <h3 className="font-display text-2xl font-semibold text-ink-primary">Free</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Pour voir un aperçu réel de votre visibilité, sans engagement.
              </p>
            </div>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight text-ink-primary">0 €</span>
            </div>
            <p className="mb-6 text-sm text-ink-muted">Sans carte bancaire</p>

            <ul className="mb-8 flex-1 space-y-4">
              {featuresFree.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink-secondary">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-border text-ink-primary">
                    <Check className="size-3.5" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/signup"
              className="mt-auto flex w-full items-center justify-center rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-ink-primary transition-all hover:border-border-strong hover:bg-elevated"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative flex flex-col rounded-xl border border-brand/50 bg-surface p-8 shadow-2xl shadow-brand/10 ring-1 ring-brand/50">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                <Sparkles className="size-3.5" /> Plan recommandé
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="font-display text-2xl font-semibold text-ink-primary">Pro</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Idéal pour les marques souhaitant maîtriser leur visibilité.
              </p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-semibold tracking-tight text-ink-primary">
                {annual ? '60 €' : '75 €'}
              </span>
              <span className="text-sm font-medium text-ink-muted">/mois</span>
            </div>
            {annual && (
              <p className="mb-6 text-sm text-success">Facturé 720 € par an (20% d'économie)</p>
            )}

            <ul className="mb-8 flex-1 space-y-4">
              {featuresPro.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink-secondary">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                    <Check className="size-3.5" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className="mt-auto flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-black transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20"
            >
              Démarrer avec Pro
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col rounded-xl border border-hairline border-border bg-surface p-8 transition-colors hover:border-border-strong hover:bg-elevated">
            <div className="mb-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-hairline border-border bg-elevated text-ink-primary">
                <Building2 className="size-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink-primary">Enterprise</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Pour les agences et les grandes structures aux besoins complexes.
              </p>
            </div>
            
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tracking-tight text-ink-primary">
                Sur devis
              </span>
            </div>

            <ul className="mb-8 flex-1 space-y-4">
              {featuresEnterprise.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-ink-secondary">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-border text-ink-primary">
                    <Check className="size-3.5" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="mailto:contact@reflet.ai"
              className="mt-auto flex w-full items-center justify-center rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-ink-primary transition-all hover:border-border-strong hover:bg-elevated"
            >
              Contacter les ventes
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
