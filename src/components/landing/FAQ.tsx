import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '~/lib/i18n/LanguageContext'

const faqs = [
  {
    q: "Qu'est-ce que Reflet mesure exactement ?",
    a: 'Reflet mesure la présence, la recommandation et la position de votre marque dans les réponses générées par ChatGPT, ainsi que la présence de vos concurrents.',
  },
  {
    q: 'Est-ce que Reflet utilise ChatGPT directement ?',
    a: 'Oui, Reflet interroge ChatGPT avec les questions que vos prospects pourraient réellement poser, puis analyse les réponses obtenues.',
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
    q: 'Puis-je essayer Reflet gratuitement ?',
    a: 'Oui, le plan Free est gratuit (0€) et permet de mesurer jusqu\'à 3 questions avec 3 mesures par semaine, sans carte bancaire.',
  },
  {
    q: 'Reflet garantit-il une position dans ChatGPT ?',
    a: "Non. Reflet mesure et explique votre visibilité actuelle et vous aide à l'améliorer, mais ne peut garantir une position spécifique dans un modèle génératif.",
  },
]

export function FAQ() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="border-t border-hairline border-border bg-canvas">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 border-x-0 border-border md:grid-cols-2 md:border-x">
        {/* Colonne intro */}
        <div className="flex flex-col gap-4 border-b border-border px-6 pt-16 pb-8 md:border-b-0 md:border-e md:px-10 md:py-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">{t.faq.tag}</span>
          <h2 className="font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink-primary md:text-5xl">
            {t.faq.heading}
          </h2>
          <p className="max-w-sm text-sm text-ink-secondary">
            {t.faq.description}
          </p>
        </div>

        {/* Colonne accordéon */}
        <div className="flex flex-col justify-center px-6 py-6 md:px-8">
          <div className="divide-y divide-border">
            {t.faq.items.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-ink-primary"
                >
                  {item.q}
                  <ChevronDown
                    className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  />
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
      </div>
    </section>
  )
}
