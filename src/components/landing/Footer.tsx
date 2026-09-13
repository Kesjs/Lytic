import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-14">
      <div className="mx-auto max-w-1200 flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
        {/* Marque et description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-[#c9ab1e] text-xs font-black text-black">
              R
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Reflet</span>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Mesure et analyse en continu de la visibilité de votre marque dans les réponses de ChatGPT et des moteurs d'IA.
          </p>
        </div>

        {/* Liens rapides & Statut */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <nav className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
            <a href="/#produit" className="hover:text-white transition-colors">
              Produit
            </a>
            <a href="/#questions" className="hover:text-white transition-colors">
              Questions
            </a>
            <a href="/#preuves" className="hover:text-white transition-colors">
              Preuves
            </a>
            <a href="/#tarifs" className="hover:text-white transition-colors">
              Tarifs
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Espace Client
            </Link>
          </nav>

          {/* Pastille de statut opérationnel */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Moteurs opérationnels</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-1200 mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <p>© 2026 Reflet. Tous droits réservés.</p>
        <p className="text-zinc-400">Mesurer · Comprendre · Conquérir l'IA</p>
      </div>
    </footer>
  )
}
