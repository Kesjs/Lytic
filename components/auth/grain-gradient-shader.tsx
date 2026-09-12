'use client'

import { useEffect, useState } from 'react'

interface GrainGradientShaderProps {
  className?: string
}

// Wrapper client-only pour @paper-design/shaders-react
export function GrainGradientShader({ className }: GrainGradientShaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={`absolute inset-0 bg-[#090e1a] ${className ?? ''}`} />
  }

  return <GrainGradientClient className={className} />
}

function GrainGradientClient({ className }: GrainGradientShaderProps) {
  const [ShaderComponent, setShaderComponent] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import('@paper-design/shaders-react')
      .then((mod) => {
        if (mod && mod.GrainGradient) {
          setShaderComponent(() => mod.GrainGradient)
        }
      })
      .catch(() => {})
  }, [])

  if (!ShaderComponent) {
    return (
      <div className={`absolute inset-0 bg-[#090e1a] overflow-hidden ${className ?? ''}`}>
        <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#3758f9]/25 blur-[130px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" />
      </div>
    )
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
      colors={['#090e1a', '#111827', '#3758f9', '#0d1322']}
      colorBack="#00000000"
      className={`absolute inset-0 ${className ?? ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
