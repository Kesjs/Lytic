import { motion } from 'framer-motion'

export function HeroKnowledgeGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Halo de lueur dorée diffuse en arrière-plan */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-[#c9ab1e]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Carte cadre moderne style studio */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/90 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header mini-terminal avec indicateur ChatGPT */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#c9ab1e] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Analyse de recommandation IA
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-400">
            <span>ChatGPT-4o</span>
          </div>
        </div>

        {/* Question du prospect simulée */}
        <div className="mb-6 rounded-xl border border-white/10 bg-black/50 p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs text-white">
              Q
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-400 font-medium">Question réelle d'un prospect :</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                « Quel est le meilleur service pour automatiser notre gestion en 2026 ? »
              </p>
            </div>
          </div>
        </div>

        {/* Schéma isométrique vectoriel */}
        <div className="relative py-2">
          <svg
            viewBox="0 0 440 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            {/* Dégradés de lignes */}
            <defs>
              <linearGradient id="goldBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c9ab1e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="mutedBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#52525b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#27272a" stopOpacity="0.1" />
              </linearGradient>
              <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Lignes du graphe isométrique vers les sorties */}
            {/* Vers Concurrent B */}
            <path
              d="M220 30 L80 110 L80 170"
              stroke="url(#mutedBeam)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* Vers Concurrent A */}
            <path
              d="M220 30 L170 110 L170 170"
              stroke="url(#mutedBeam)"
              strokeWidth="1.5"
            />
            {/* Vers VOTRE MARQUE (Gold Beam animé) */}
            <path
              d="M220 30 L330 110 L330 160"
              stroke="url(#goldBeam)"
              strokeWidth="2.5"
              filter="url(#glowGold)"
            />

            {/* Nœud Central : Moteur sémantique */}
            <circle cx="220" cy="30" r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="220" cy="30" r="5" fill="#a1a1aa" />

            {/* Sortie 1 : Concurrent B */}
            <circle cx="80" cy="170" r="10" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            <text x="80" y="195" textAnchor="middle" fill="#71717a" fontSize="10" fontWeight="500">
              Concurrent B
            </text>
            <text x="80" y="210" textAnchor="middle" fill="#52525b" fontSize="9">
              14% part de voix
            </text>

            {/* Sortie 2 : Concurrent A */}
            <circle cx="170" cy="170" r="12" fill="#18181b" stroke="#52525b" strokeWidth="1.5" />
            <text x="170" y="195" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontWeight="500">
              Concurrent A
            </text>
            <text x="170" y="210" textAnchor="middle" fill="#71717a" fontSize="9">
              28% part de voix
            </text>

            {/* Sortie 3 : VOTRE MARQUE (Illuminée en jaune soufre) */}
            {/* Anneau de pulsation */}
            <circle
              cx="330"
              cy="160"
              r="26"
              fill="none"
              stroke="#c9ab1e"
              strokeWidth="1"
              opacity="0.35"
              strokeDasharray="2 2"
            />
            <circle
              cx="330"
              cy="160"
              r="20"
              fill="none"
              stroke="#c9ab1e"
              strokeWidth="1.5"
              opacity="0.7"
            />
            {/* Cœur illuminé */}
            <circle
              cx="330"
              cy="160"
              r="14"
              fill="#c9ab1e"
              filter="url(#glowGold)"
            />
            <text x="330" y="164" textAnchor="middle" fill="#000000" fontSize="11" fontWeight="800">
              #1
            </text>

            {/* Badge flottant Votre Marque */}
            <rect
              x="270"
              y="185"
              width="120"
              height="26"
              rx="6"
              fill="#18181b"
              stroke="#c9ab1e"
              strokeWidth="1.5"
            />
            <text x="330" y="202" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
              Votre Marque (58%)
            </text>
          </svg>
        </div>

        {/* Footer info de mesure */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-300 font-medium">Recommandé en 1ère position</span>
          </div>
          <span className="font-semibold text-[#c9ab1e]">Score IA : 87/100</span>
        </div>
      </div>
    </motion.div>
  )
}
