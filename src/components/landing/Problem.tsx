import { useTranslation } from '~/lib/i18n/LanguageContext'
import { Waterline } from './Waterline'

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
  const { t } = useTranslation()

  return (
    <section id="problem" className="border-t border-hairline border-border px-6 py-24">
      <div className="mx-auto max-w-1200">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="max-w-lg text-3xl font-medium leading-[1.15] tracking-tight text-ink-primary sm:text-4xl">
              {t.problem.heading}
            </h2>
            <div className="mt-8 space-y-4">
              {t.problem.items.map((item) => (
                <div key={item.title} className="rounded-xl border border-hairline border-border bg-surface p-5">
                  <p className="text-sm font-medium text-ink-primary">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              {t.problem.footer}
            </p>
          </div>

          {/* L'illustration se prolonge dans son propre reflet, atténué — le
              premier rappel visuel, discret, du nom du produit. */}
          <div className="rounded-xl border border-hairline border-border bg-surface p-5">
            <MissingPieceIllustration />
            <div
              aria-hidden="true"
              className="-mt-6 scale-y-[-1] opacity-[0.18]"
              style={{
                maskImage: 'linear-gradient(to bottom, black, transparent 70%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 70%)',
              }}
            >
              <MissingPieceIllustration />
            </div>
          </div>
        </div>

        <Waterline />

        {/* Le bon réflexe : poser aux IA les questions que poseraient vraiment
            vos prospects, pas leur demander de parler de vous. */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-ink-primary">
              {t.problem.question.heading}
            </h3>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
              {t.problem.question.description}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-md border border-hairline border-danger/30 bg-danger/5 px-4 py-3">
              <span className="text-sm text-danger">✕</span>
              <span className="text-sm text-ink-secondary">{t.problem.question.badExample}</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-hairline border-success/30 bg-success/5 px-4 py-3">
              <span className="text-sm text-success">✓</span>
              <span className="text-sm text-ink-primary">{t.problem.question.goodExample}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
