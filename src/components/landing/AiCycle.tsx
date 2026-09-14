import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RiOpenaiFill, RiPerplexityFill, RiGeminiFill, RiMicrosoftCopilotFill, RiAnthropicFill } from 'react-icons/ri'

export type AiEngine = {
  name: string
  Icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_ENGINES: AiEngine[] = [
  { name: 'ChatGPT', Icon: RiOpenaiFill },
  { name: 'Perplexity', Icon: RiPerplexityFill },
  { name: 'Gemini', Icon: RiGeminiFill },
  { name: 'Copilot', Icon: RiMicrosoftCopilotFill },
  { name: 'Claude', Icon: RiAnthropicFill },
]

export function AiCycle({
  engines = DEFAULT_ENGINES,
  interval = 2200,
}: {
  engines?: AiEngine[]
  interval?: number
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % engines.length), interval)
    return () => clearInterval(id)
  }, [engines.length, interval])

  return (
    <div className="mt-5 flex items-center justify-center h-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={engines[index].name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          {/* Badge rond blanc avec l'icône centrée */}
          <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm">
            {(() => {
              const CurrentIcon = engines[index].Icon
              return <CurrentIcon className="size-5 text-black" />
            })()}
          </div>
          <span className="font-medium text-ink-primary text-sm">
            {engines[index].name}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
