// Séparateur signature de la landing — la seule idée graphique "risquée" du
// redesign, réservée aux endroits où le contenu bascule d'un constat vers
// son reflet (la question mal posée, le benchmark face à la concurrence).
// Une ligne qui s'efface aux extrémités, un point qui la traverse comme une
// goutte à la surface de l'eau — jamais répété plus de deux fois par page.
export function Waterline() {
  return (
    <div aria-hidden="true" className="relative my-16 h-px w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-info/70 shadow-[0_0_16px_3px_rgb(var(--color-info)/0.35)]" />
    </div>
  )
}
