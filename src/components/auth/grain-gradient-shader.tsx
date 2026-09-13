import { useEffect, useState } from 'react'

interface GrainGradientShaderProps {
  className?: string
}

// Wrapper client-only pour @paper-design/shaders-react
// Le shader WebGL ne peut pas s'exécuter côté serveur
export function GrainGradientShader({ className }: GrainGradientShaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Fallback SSR : fond noir simple
    return <div className={`absolute inset-0 bg-black ${className ?? ''}`} />
  }

  return <GrainGradientClient className={className} />
}

// Chargement dynamique du shader uniquement côté client
function GrainGradientClient({ className }: GrainGradientShaderProps) {
  const [ShaderComponent, setShaderComponent] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import('@paper-design/shaders-react').then((mod) => {
      setShaderComponent(() => mod.GrainGradient)
    })
  }, [])

  if (!ShaderComponent) {
    return <div className={`absolute inset-0 bg-black ${className ?? ''}`} />
  }

  return (
    <ShaderComponent
      speed={0.75}
      scale={1}
      rotation={0}
      offsetX={0}
      offsetY={0}
      softness={0.55}
      intensity={0.5}
      noise={0.22}
      shape="corners"
      // Palette Reflet : noir profond → gris → gris chaud → blanc sourd
      colors={['#0b0b0b', '#2a2a2a', '#c9ab1e', '#0b0b0b']}
      colorBack="#00000000"
      className={`absolute inset-0 ${className ?? ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
