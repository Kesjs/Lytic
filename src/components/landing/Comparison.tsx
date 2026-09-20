import {
  Check,
  CircleAlert,
  CircleCheck,
  Minus,
} from "lucide-react";

const BEFORE = [
  "Vous tapez vos questions une par une dans ChatGPT le lundi matin",
  "Vous notez vaguement les résultats dans un fichier Excel",
  "Vous oubliez de vérifier pendant 3 semaines par manque de temps",
  "Vous découvrez par hasard qu'un concurrent a pris votre place",
] as const;

const AFTER = [
  "Vos questions stratégiques sont mesurées chaque semaine en arrière-plan",
  "Un tableau de bord construit l'historique chiffré de votre visibilité",
  "L'outil détecte automatiquement les concurrents cités à votre place",
  "Vous êtes alerté dès que l'IA change d'avis sur votre marque",
] as const;

export function Comparison() {
  return (
    <section className="bg-canvas py-24 border-t border-hairline border-border">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium uppercase tracking-widest mb-6">
            L'Ancienne méthode vs Reflet
          </div>
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-5xl leading-[1.15]">
            La même mission, gérée de deux façons
          </h2>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border/60 bg-border md:grid-cols-2 shadow-2xl shadow-black/40">
          {/* Avant */}
          <div className="bg-canvas p-8 sm:p-12 relative group transition-colors hover:bg-surface/30">
            <div className="absolute inset-0 bg-danger/5 pointer-events-none opacity-50" />
            <div className="relative flex items-center gap-3">
              <CircleAlert
                aria-hidden
                className="size-5 text-danger"
              />
              <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-primary font-bold">
                Le faire à la main
              </h3>
            </div>
            <ul className="relative mt-10 flex flex-col gap-8">
              {BEFORE.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 text-sm text-ink-secondary"
                >
                  <Minus
                    aria-hidden
                    className="mt-1 size-4 shrink-0 text-danger/50"
                  />
                  <span className="leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Après */}
          <div className="bg-surface/80 p-8 sm:p-12 relative overflow-hidden group">
            {/* Soft inner glow */}
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-brand/10 blur-3xl transition-opacity duration-500 opacity-50 group-hover:opacity-100 pointer-events-none" />
            
            <div className="relative flex items-center gap-3">
              <CircleCheck aria-hidden className="size-5 text-brand" />
              <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-brand font-bold">
                Automatiser avec Reflet
              </h3>
            </div>
            <ul className="relative mt-10 flex flex-col gap-8">
              {AFTER.map((item) => (
                <li key={item} className="flex gap-4 text-[15px] text-ink-primary font-medium">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" strokeWidth={3} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
