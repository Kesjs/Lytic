import { Newspaper, Clock, ArrowUpRight, Bot, TrendingUp, Search, Radar } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '~/components/landing/Navbar'
import { Footer } from '~/components/landing/Footer'

type Article = {
  title: string
  excerpt: string
  tag: string
  readTime: string
  icon: typeof Bot
}

const articles: Article[] = [
  {
    title: 'GEO vs SEO : ce qui change quand vos clients posent leurs questions à une IA',
    excerpt:
      "Le référencement classique optimise une page pour apparaître dans une liste de liens. Le GEO optimise votre contenu pour être compris, cité et recommandé dans une réponse générée. Les deux logiques coexistent, mais les leviers ne sont plus les mêmes.",
    tag: 'GEO',
    readTime: '6 min',
    icon: TrendingUp,
  },
  {
    title: 'Pourquoi ChatGPT ne parle pas encore de votre marque (et comment le vérifier)',
    excerpt:
      "Absence de mention ne veut pas dire mauvaise réputation : souvent, c'est un problème de contenu indexable, de structure ou de couverture des bons sujets. Voici comment diagnostiquer la cause avant d'agir.",
    tag: 'Visibilité IA',
    readTime: '5 min',
    icon: Bot,
  },
  {
    title: 'Autoriser GPTBot, ClaudeBot et PerplexityBot : le guide technique en 10 minutes',
    excerpt:
      "Un fichier robots.txt mal configuré peut bloquer sans le vouloir les crawlers des IA. Ce qu'il faut vérifier, ligne par ligne, pour rester visible sans exposer plus que nécessaire.",
    tag: 'Technique',
    readTime: '4 min',
    icon: Search,
  },
  {
    title: 'Lire un score de visibilité IA sans se tromper',
    excerpt:
      "Un score qui monte n'est pas toujours une bonne nouvelle, et l'inverse est vrai aussi. Comment interpréter la position moyenne, la fréquence de citation et le contexte des mentions ensemble plutôt qu'isolément.",
    tag: 'Mesure',
    readTime: '7 min',
    icon: Radar,
  },
]

export const Route = createFileRoute('/blog')({
  component: BlogPage,
})

function BlogPage() {
  return (
    <main className="theme-landing min-h-screen bg-canvas">
      <Navbar />

      <section className="px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-ink-muted">
            <Newspaper className="size-6" />
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            Visibilité de marque dans les réponses IA, GEO, et retours d'expérience — pour comprendre ce qui se joue
            quand les IA répondent à la place de votre site.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 sm:pb-32">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2">
          {articles.map((article) => {
            const Icon = article.icon
            return (
              <article
                key={article.title}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-elevated hover:shadow-xl hover:shadow-brand/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated text-ink-muted transition-colors group-hover:text-brand-text group-hover:border-brand/20">
                    <Icon className="size-5" />
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-muted">
                    {article.tag}
                  </span>
                </div>

                <h2 className="font-display text-lg font-semibold text-ink-primary">{article.title}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-secondary">{article.excerpt}</p>

                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Clock className="size-3.5" /> {article.readTime} de lecture
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary transition-colors group-hover:text-ink-primary">
                    Lire l'article <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </article>
            )
          })}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-ink-muted">
          D'autres articles arrivent régulièrement — abonnez-vous pour ne rien manquer.
        </p>
      </section>

      <Footer />
    </main>
  )
}
