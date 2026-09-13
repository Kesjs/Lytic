import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { HeroKnowledgeGraph } from './HeroKnowledgeGraph'

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-36 md:pt-44">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        {/* Colonne Gauche — Accroche éditoriale & CTA direct */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge de catégorie */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-zinc-300 backdrop-blur-sm">
            <Sparkles className="size-3 text-[#c9ab1e]" />
            <span className="font-medium tracking-wide">Visibilité dans les moteurs génératifs</span>
          </div>

          {/* Grand Titre H1 avec mise en valeur spectaculaire sur "IA" */}
          <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[54px]">
            Voyez exactement comment les{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#fef08a] via-[#c9ab1e] to-[#eab308] bg-clip-text font-black text-transparent drop-shadow-[0_0_24px_rgba(201,171,30,0.5)]">
                IA
              </span>
              {/* Lueur d'arrière-plan sous le mot IA */}
              <span
                className="absolute inset-0 -z-10 rounded-lg bg-[#c9ab1e]/20 blur-lg"
                aria-hidden="true"
              />
            </span>{' '}
            recommandent votre marque.
          </h1>

          {/* Sous-titre direct et percutant axé sur ChatGPT */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Vos futurs clients interrogent <span className="text-zinc-200 font-medium">ChatGPT</span> avant d'acheter. Reflet analyse ses réponses en temps réel pour vous montrer si votre marque est recommandée ou si vos concurrents prennent toute la place.
          </p>

          {/* Boutons d'action directs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#c9ab1e] px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#b89a18] hover:shadow-[0_0_24px_rgba(201,171,30,0.35)]"
            >
              Analyser mon site
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#produit"
              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Découvrir le fonctionnement
            </a>
          </div>

          {/* Micro-indicateur sans blabla */}
          <div className="mt-8 flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#c9ab1e]" />
              <span>1 site surveillé</span>
            </div>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#c9ab1e]" />
              <span>Jusqu'à 30 questions réelles</span>
            </div>
            <span className="text-zinc-700">·</span>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#c9ab1e]" />
              <span>Mesure continue</span>
            </div>
          </div>
        </motion.div>

        {/* Colonne Droite — Illustration isométrique Knowledge Graph */}
        <div className="w-full">
          <HeroKnowledgeGraph />
        </div>
      </div>
    </section>
  )
}
