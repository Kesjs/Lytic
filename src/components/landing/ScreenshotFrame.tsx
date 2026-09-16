import { Camera } from 'lucide-react'

// Emplacement réservé pour une vraie capture du dashboard — jamais une
// recréation en JSX de l'UI produit (voir discussion : Linear et Lumail
// montrent toujours de vrais screenshots, jamais des mockups recodés).
// Sans `src`, affiche un placeholder explicite en bordure pointillée ;
// une fois la vraie image reçue, passer `src` (et idéalement `alt`) suffit
// à la faire apparaître dans le même cadre.

interface ScreenshotFrameProps {
  label: string
  src?: string
  alt?: string
  aspect?: string
  className?: string
}

export function ScreenshotFrame({
  label,
  src,
  alt,
  aspect = 'aspect-[16/10]',
  className = '',
}: ScreenshotFrameProps) {
  if (src) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-hairline border-border bg-surface shadow-2xl shadow-black/50 ${className}`}
      >
        <img src={src} alt={alt ?? label} className="block h-auto w-full" />
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
