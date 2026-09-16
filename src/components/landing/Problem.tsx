const items = [
  { title: 'Invisible', body: "Votre marque n'apparaît pas dans les recommandations pertinentes." },
  { title: 'Mal positionnée', body: "Elle apparaît derrière d'autres solutions." },
  { title: 'Mal comprise', body: "Votre site exprime une offre claire, mais les réponses observées ne la reflètent pas correctement." },
]

// Illustration conceptuelle, pas un mockup d'UI : un cube manque dans le
// cluster (contour pointillé) — la marque absente de la réponse. Pure
// géométrie isométrique, façon FIG 0.x de Linear.
function MissingPieceIllustration() {
  return (
    <div className="flex aspect-square w-full items-center justify-center text-ink-muted">
      <svg viewBox="0 0 320 280" className="h-full w-full max-w-xs" aria-hidden="true">
        <text x="8" y="20" className="fill-ink-muted text-[10px] uppercase tracking-widest">
          Fig 01
        </text>

        {/* Cube 1 — solide */}
        <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.85">
          <path d="M90,70 L135,96 L90,122 L45,96 Z" />
          <path d="M135,96 L90,122 L90,177 L135,151 Z" />
          <path d="M45,96 L90,122 L90,177 L45,151 Z" />
        </g>

        {/* Cube 2 — solide */}
        <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.85">
          <path d="M210,50 L255,76 L210,102 L165,76 Z" />
          <path d="M255,76 L210,102 L210,157 L255,131 Z" />
          <path d="M165,76 L210,102 L210,157 L165,131 Z" />
        </g>

        {/* Cube 3 — manquant : marque absente de la réponse */}
        <g stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" fill="none" opacity="0.45">
          <path d="M200,140 L245,166 L200,192 L155,166 Z" />
          <path d="M245,166 L200,192 L200,247 L245,221 Z" />
          <path d="M155,166 L200,192 L200,247 L155,221 Z" />
        </g>
      </svg>
    </div>
  )
}

export function Problem() {
  return (
    <section className="border-t border-hairline border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-ink-primary">
            Votre site sait ce que vous vendez. ChatGPT, lui, peut en dire autre chose.
          </h2>
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-xl border border-hairline border-border bg-surface p-5">
                <p className="text-sm font-medium text-ink-primary">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Reflet mesure cet écart au lieu de vous demander de le deviner.
          </p>
        </div>

        <div className="rounded-xl border border-hairline border-border bg-surface p-5">
          <MissingPieceIllustration />
        </div>
      </div>
    </section>
  )
}
