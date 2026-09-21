import { Lock } from 'lucide-react'

// Aperçu marketing du dashboard : un vrai screenshot (public/images/dashboard/overview.png),
// affiché dans un cadre "navigateur" (dots + barre d'adresse), comme une image classique.
// Rend un résultat identique sur tous les écrans/navigateurs, contrairement à une
// recréation JSX qui doit se reflow en responsive. Le vrai dashboard
// (src/routes/dashboard) reste la seule source de chiffres réels.

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[880px] rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(201,171,30,0.12)]">
      <div className="overflow-hidden rounded-[15px] bg-[#0c0c0e]">
        {/* Barre "navigateur" — cadre de fenêtre */}
        <div className="flex h-9 items-center justify-between border-b border-white/[0.07] bg-[#141416]/95 px-3.5 backdrop-blur-md sm:h-10 sm:px-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f56]/85 ring-1 ring-[#ff5f56]/30" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]/85 ring-1 ring-[#ffbd2e]/30" />
            <span className="size-2.5 rounded-full bg-[#27c93f]/85 ring-1 ring-[#27c93f]/30" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/50 px-2.5 py-0.5 text-[11px] font-mono text-ink-muted">
            <Lock className="size-2.5 text-brand-text opacity-75" />
            <span>tryreflet.pro/dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span className="hidden sm:inline">Reflet</span>
          </div>
        </div>

        {/* Screenshot réel du dashboard */}
        <div className="bg-[#0a0a0c]">
          <img
            src="/images/dashboard/overview.png"
            alt="Aperçu du dashboard Reflet : score global, mentions, recommandations et position moyenne"
            width={1024}
            height={469}
            className="block w-full h-auto"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}
