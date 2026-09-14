import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot } from 'lucide-react'

const DEFAULT_ENGINES = ['ChatGPT', 'Perplexity', 'Gemini', 'Copilot', 'Claude']

export function AiCycle({
  engines = DEFAULT_ENGINES,
  interval = 2200,
}: {
  engines?: string[]
  interval?: number
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % engines.length), interval)
    return () => clearInterval(id)
  }, [engines.length, interval])

  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-secondary">
      <Bot className="size-4 text-brand-text" aria-hidden="true" />
      <AnimatePresence mode="wait">
        <motion.span
          key={engines[index]}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="font-medium text-ink-primary"
        >
          {engines[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
