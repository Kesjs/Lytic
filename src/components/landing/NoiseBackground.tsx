export function NoiseBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden opacity-[0.035] mix-blend-screen"
      aria-hidden="true"
    >
      {/* Texture fractale de grain mat / sable fin en pur SVG mathématique */}
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  )
}
