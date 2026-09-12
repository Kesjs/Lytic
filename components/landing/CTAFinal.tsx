import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTAFinal() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-12 text-center">
        <h2 className="text-3xl font-medium tracking-tight text-ink-primary">
          Découvrez ce que ChatGPT dit de votre marque.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
          Analysez votre site, sélectionnez vos questions et obtenez votre première mesure.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-brand-hover"
        >
          Analyser mon site
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
