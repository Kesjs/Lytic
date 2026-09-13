import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function CTAFinal() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#121215]/90 p-10 sm:p-16 text-center shadow-2xl backdrop-blur-xl"
        >
          {/* Lueur dorée centrale en arrière-plan */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-[#c9ab1e]/15 blur-3xl"
            aria-hidden="true"
          />

          {/* Badge haut */}
          <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-zinc-300">
            <Sparkles className="size-3 text-[#c9ab1e]" />
            <span>Prenez l'avantage avant vos concurrents</span>
          </div>

          {/* Titre fort */}
          <h2 className="relative z-10 mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Prêt à voir comment ChatGPT parle de vous ?
          </h2>

          {/* Sous-titre direct */}
          <p className="relative z-10 mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Découvrez en quelques secondes vos positions, vos opportunités manquées et ce que vos prospects découvrent lorsqu'ils cherchent votre expertise.
          </p>

          {/* Boutons d'action */}
          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c9ab1e] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#b89a18] hover:shadow-[0_0_24px_rgba(201,171,30,0.4)]"
            >
              Analyser mon site maintenant
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <p className="relative z-10 mt-5 text-xs text-zinc-500">
            Sans carte bancaire · Première analyse instantanée
          </p>
        </motion.div>
      </div>
    </section>
  )
}
