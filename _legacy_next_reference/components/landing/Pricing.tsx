'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const features = ['1 site suivi', "Jusqu'à 30 questions", 'Mesure continue', 'ChatGPT uniquement', 'Analyse hebdomadaire']

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="tarifs" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-3xl font-medium tracking-tight text-ink-primary">Tarifs</h2>

        <div className="mt-8 inline-flex rounded-md border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded px-4 py-1.5 text-sm transition-colors ${!annual ? 'bg-elevated text-ink-primary' : 'text-ink-muted'}`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded px-4 py-1.5 text-sm transition-colors ${annual ? 'bg-elevated text-ink-primary' : 'text-ink-muted'}`}
          >
            Annuel
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-left">
          {annual ? (
            <p className="text-sm text-ink-muted">Tarif annuel disponible prochainement.</p>
          ) : (
            <>
              <p className="text-4xl font-medium text-ink-primary">
                75 €<span className="text-base font-normal text-ink-muted">/mois</span>
              </p>
              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink-secondary">
                    <Check className="size-4 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 block rounded-md bg-brand py-2.5 text-center text-sm font-medium text-black transition-colors hover:bg-brand-hover"
              >
                Analyser mon site
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
