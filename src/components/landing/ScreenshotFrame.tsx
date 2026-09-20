import { Camera, Lock } from 'lucide-react'

// Emplacement pour une vraie capture du dashboard habillée avec un cadre
// d'application élégant (boutons de fenêtre macOS, badge URL, liseré fin et lueur ambiante).
interface ScreenshotFrameProps {
  label: string
  src?: string
  alt?: string
  aspect?: string
  className?: string
  urlPath?: string
  glow?: boolean
  showControls?: boolean
  fadeBottom?: boolean
  annotation?: string
  badge?: string
  hideCrosses?: boolean
}

export function ScreenshotFrame({
  label,
  src,
  alt,
  aspect = 'aspect-[16/10]',
  className = '',
  urlPath,
  glow = false,
  showControls = true,
  fadeBottom = false,
  annotation,
  badge,
  hideCrosses = false,
}: ScreenshotFrameProps) {
  if (src) {
    return (
      <div className={`group relative ${className}`}>
        {/* Annotation décorative style Nooma avec flèche incurvée */}
        {annotation && (
          <div className="absolute -top-9 right-3 z-30 hidden md:flex items-center gap-2 select-none">
            <span className="text-xs italic tracking-wide text-brand-text font-medium">
              {annotation}
            </span>
            <svg
              className="size-5 text-brand-text/80 -rotate-12 translate-y-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4c5 0 11 3.5 11 11" />
              <polyline points="9 15 15 15 15 9" />
            </svg>
          </div>
        )}

        {/* Glow diffus d'ambiance */}
        {glow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-b from-brand/20 via-brand/5 to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
          />
        )}



        {/* Double liseré décoré avec gradient subtil */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-white/10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(201,171,30,0.12)]">
          {/* Cadre intérieur de la fenêtre */}
          <div className="relative overflow-hidden rounded-[15px] bg-[#0c0c0e]">
            {showControls && (
              <div className="flex h-9 items-center justify-between border-b border-white/[0.07] bg-[#141416]/95 px-3.5 backdrop-blur-md sm:h-10 sm:px-4">
                {/* Pastilles de contrôle fenêtre */}
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f56]/85 ring-1 ring-[#ff5f56]/30" />
                  <span className="size-2.5 rounded-full bg-[#ffbd2e]/85 ring-1 ring-[#ffbd2e]/30" />
                  <span className="size-2.5 rounded-full bg-[#27c93f]/85 ring-1 ring-[#27c93f]/30" />
                </div>

                {/* URL badge ou titre centré */}
                {urlPath ? (
                  <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/50 px-2.5 py-0.5 text-[11px] font-mono text-ink-muted">
                    <Lock className="size-2.5 text-brand-text opacity-75" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{urlPath}</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-ink-muted/80">{label}</span>
                )}

                {/* Badge contextuel ou statut discret */}
                {badge ? (
                  <div className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand-text">
                    <span className="size-1.5 rounded-full bg-brand-text animate-pulse" />
                    <span className="hidden sm:inline">{badge}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                    <span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                    <span className="hidden sm:inline">Reflet</span>
                  </div>
                )}
              </div>
            )}

            {/* Image parfaitement calée */}
            <div className="relative overflow-hidden bg-[#09090b]">
              <img
                src={src}
                alt={alt ?? label}
                draggable={false}
                className="block h-auto w-full object-cover object-top pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.004]"
                loading="lazy"
              />
              {/* Liseré interne pour un contour ultra précis */}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />

              {/* Fondu très léger au bas (légèrement estompé, sans flou excessif) */}
              {fadeBottom && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 sm:h-12 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex ${aspect} flex-col items-center justify-center gap-3 rounded-xl border border-hairline border-dashed border-border bg-surface/40 text-center ${className}`}
    >
      <Camera className="size-5 text-ink-muted" />
      <p className="max-w-[240px] text-xs text-ink-muted">Capture d'écran réservée — {label}</p>
    </div>
  )
}
