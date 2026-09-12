'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: "Qu'est-ce que Reflet mesure exactement ?",
    a: 'Reflet mesure la présence, la recommandation et la position de votre marque dans les réponses générées par ChatGPT, ainsi que la présence de vos concurrents.',
  },
  {
    q: 'Est-ce que Reflet utilise ChatGPT directement ?',
    a: "Oui, Reflet interroge ChatGPT avec les questions que vos prospects pourraient réellement poser, puis analyse les réponses obtenues.",
  },
  {
    q: 'Pourquoi les réponses peuvent-elles varier ?',
    a: "Les modèles génératifs peuvent produire des réponses différentes d'une requête à l'autre. Reflet mesure ces variations dans le temps plutôt qu'un instantané unique.",
  },
  {
    q: 'Comment Reflet choisit-il les questions ?',
    a: 'Reflet analyse votre site pour comprendre votre offre, puis construit des questions représentatives de ce que vos prospects pourraient poser.',
  },
  {
    q: 'Est-ce que Reflet détecte les modifications de mon site ?',
    a: 'Oui, Reflet surveille automatiquement votre site et signale les changements détectés.',
  },
  {
    q: 'Est-ce que je dois déclarer chaque modification ?',
    a: "Non, la surveillance est automatique — vous n'avez rien à déclarer.",
  },
  {
    q: 'Reflet garantit-il une position dans ChatGPT ?',
    a: "Non. Reflet mesure et explique votre visibilité actuelle et vous aide à l'améliorer, mais ne peut garantir une position spécifique dans un modèle génératif.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-medium tracking-tight text-ink-primary">Questions fréquentes</h2>
        <div className="mt-12 divide-y divide-border border-b border-t border-border">
          {faqs.map((item, i) => (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-ink-primary"
              >
                {item.q}
                <ChevronDown className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <div
                className="grid overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm leading-relaxed text-ink-secondary">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
