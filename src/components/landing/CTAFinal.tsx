import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function CTAFinal() {
  return (
    <section className="border-t border-hairline border-border bg-canvas px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl md:text-5xl">
          Découvrez ce que ChatGPT dit de votre marque.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-secondary sm:text-base">
          Analysez votre site, sélectionnez vos questions clés et obtenez votre premier score de visibilité IA dès aujourd'hui.
        </p>

        <Link
          to="/login"
          className="group mt-9 inline-flex items-center justify-center gap-2.5 rounded-md border border-border bg-transparent px-7 py-3.5 text-sm font-medium text-ink-primary transition-all duration-200 hover:border-brand/60 hover:text-brand-text"
        >
          <span>Analyser mon site</span>
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
