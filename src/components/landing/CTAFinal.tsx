import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTAFinal() {
  return (
    <section className="relative overflow-hidden border-t border-border px-6 py-28 md:py-36">
      {/* Background Texture avec fondu radial pour toute la section */}
      <div
        className="pointer-events-none absolute inset-0 z-0 select-none bg-[url('/dark-texture.jpg')] bg-cover bg-center opacity-35 mix-blend-screen"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 75% at 50% 50%, black 30%, transparent 92%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 75% at 50% 50%, black 30%, transparent 92%)',
        }}
        aria-hidden="true"
      />

      {/* Carte CTA centrale avec texture intégrée et relief */}
      <div className="relative z-10 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/80 bg-surface/85 p-10 sm:p-16 text-center shadow-2xl backdrop-blur-xl">
        {/* Glow discret au sommet de la carte */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-brand/15 blur-[90px]"
          aria-hidden="true"
        />

        {/* Texture interne subtile pour donner du grain à la carte */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[url('/dark-texture.jpg')] bg-cover bg-center opacity-25 mix-blend-overlay"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge discret */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-black/40 px-3 py-1 text-xs font-medium text-brand-text backdrop-blur-sm mb-6">
            <Sparkles className="size-3 text-brand" />
            <span>Audit instantané</span>
          </div>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl md:text-5xl">
            Découvrez ce que ChatGPT dit de votre marque.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-secondary sm:text-base">
            Analysez votre site, sélectionnez vos questions clés et obtenez votre premier score de visibilité IA dès aujourd'hui.
          </p>

          {/* Bouton Shimmer CTA animé */}
          <Link
            to="/login"
            className="group relative mt-9 inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-lg bg-brand px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-brand-hover hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,171,30,0.5)] active:scale-[0.98]"
          >
            {/* Shimmer sweep effect */}
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
              aria-hidden="true"
            />
            <span className="relative z-10">Analyser mon site</span>
            <ArrowRight className="relative z-10 size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
