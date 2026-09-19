import { BookMarked } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

type Term = { term: string; definition: string }
type Section = { label: string; terms: Term[] }

const sections: Section[] = [
  {
    label: 'Concepts clés',
    terms: [
      {
        term: 'GEO (Generative Engine Optimization)',
        definition:
          "Ensemble des pratiques visant à améliorer la visibilité et la justesse de présentation d'une marque dans les réponses générées par les IA conversationnelles, par opposition au SEO classique orienté moteurs de recherche.",
      },
      {
        term: 'AEO (Answer Engine Optimization)',
        definition:
          "Approche proche du GEO, centrée sur l'optimisation du contenu pour qu'il soit repris comme réponse directe par les moteurs de réponse (assistants IA, réponses enrichies).",
      },
      {
        term: 'LLM (Large Language Model)',
        definition:
          "Modèle de langage de grande taille, capable de générer du texte et de répondre à des questions à partir d'un vaste corpus d'entraînement.",
      },
      {
        term: 'Indexation IA',
        definition:
          "Processus par lequel le contenu d'un site devient accessible et exploitable par les modèles ou moteurs de réponse IA, distinct de l'indexation classique des moteurs de recherche.",
      },
    ],
  },
  {
    label: 'Bots & crawl IA',
    terms: [
      {
        term: 'Crawl bot IA',
        definition:
          "Robot d'indexation utilisé par un fournisseur d'IA pour parcourir le web et alimenter son modèle ou ses réponses (ex. GPTBot, ClaudeBot, PerplexityBot).",
      },
      { term: 'GPTBot', definition: "Crawler officiel d'OpenAI qui explore les sites pour l'entraînement et l'enrichissement des réponses de ChatGPT." },
      { term: 'ClaudeBot', definition: "Crawler officiel d'Anthropic utilisé pour indexer du contenu web accessible aux réponses de Claude." },
      { term: 'PerplexityBot', definition: "Crawler utilisé par Perplexity pour récupérer du contenu web servant à construire ses réponses sourcées." },
    ],
  },
  {
    label: 'Mesure & scoring',
    terms: [
      {
        term: 'Score de visibilité',
        definition:
          "Indicateur synthétique qui résume la fréquence, la position et la qualité des mentions d'une marque dans les réponses IA suivies.",
      },
      {
        term: 'Share of voice IA',
        definition:
          "Part de visibilité d'une marque par rapport à ses concurrents, mesurée sur l'ensemble des réponses IA observées pour un jeu de questions donné.",
      },
      {
        term: 'Position moyenne',
        definition:
          "Rang moyen auquel une marque apparaît dans les réponses IA lorsqu'elle est citée, parmi les autres solutions mentionnées.",
      },
      {
        term: 'Question suivie',
        definition:
          "Requête type que poserait un utilisateur à une IA, utilisée comme point de mesure récurrent pour suivre l'évolution de la visibilité d'une marque.",
      },
      {
        term: 'Opportunité',
        definition:
          "Écart identifié entre ce qu'une IA répond aujourd'hui et ce que le site pourrait démontrer, avec une action concrète suggérée pour le combler.",
      },
      {
        term: 'Preuve (evidence)',
        definition:
          "Élément du site — page, paragraphe, donnée — qui permet de vérifier ou d'expliquer une observation faite dans une réponse IA.",
      },
    ],
  },
]

export const Route = createFileRoute('/glossaire')({
  component: GlossairePage,
})

function GlossairePage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-ink-muted">
            <BookMarked className="size-6" />
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Glossaire
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            Les termes du GEO et de la visibilité de marque dans les réponses IA, expliqués simplement.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-4xl space-y-14">
          {sections.map((section) => (
            <div key={section.label}>
              <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                {section.label}
              </h2>
              <dl className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
                {section.terms.map((item) => (
                  <div key={item.term} className="grid gap-1.5 p-5 sm:grid-cols-[220px_1fr] sm:gap-6">
                    <dt className="font-display text-sm font-semibold text-ink-primary">{item.term}</dt>
                    <dd className="text-sm text-ink-secondary">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
