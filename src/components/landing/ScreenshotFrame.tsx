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
}: ScreenshotFrameProps) {
  if (src) {
    return (
      <div className={`group relative ${className}`}>
        {/* Glow diffus d'ambiance */}
        {glow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1.5 -z-10 rounded-2xl bg-gradient-to-b from-brand/20 via-brand/5 to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
          />
        )}

        {/* Cadre de fenêtre applicative / navigateur */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)] sm:rounded-2xl">
          {showControls && (
            <div className="flex h-9 items-center justify-between border-b border-white/[0.07] bg-[#141415]/90 px-3.5 backdrop-blur-md sm:h-10 sm:px-4">
              {/* Pastilles de contrôle fenêtre */}
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f56]/80 ring-1 ring-[#ff5f56]/30" />
                <span className="size-2.5 rounded-full bg-[#ffbd2e]/80 ring-1 ring-[#ffbd2e]/30" />
                <span className="size-2.5 rounded-full bg-[#27c93f]/80 ring-1 ring-[#27c93f]/30" />
              </div>

              {/* URL badge ou titre centré */}
              {urlPath ? (
                <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-black/40 px-2.5 py-0.5 text-[11px] font-mono text-ink-muted">
                  <Lock className="size-2.5 text-brand-text opacity-70" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{urlPath}</span>
                </div>
              ) : (
                <span className="text-[11px] font-mono text-ink-muted/80">{label}</span>
              )}

              {/* Indicateur de statut discret */}
              <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                <span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                <span className="hidden sm:inline">Reflet</span>
              </div>
            </div>
          )}

          {/* Image détourée et parfaitement calée */}
          <div className="relative overflow-hidden bg-[#09090b]">
            <img
              src={src}
              alt={alt ?? label}
              className="block h-auto w-full object-cover object-top select-none transition-transform duration-700 ease-out group-hover:scale-[1.005]"
              loading="lazy"
            />
            {/* Liseré interne pour un contour ultra précis */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />
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
