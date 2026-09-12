import { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  onComplete: (code: string) => void
  error?: boolean
  success?: boolean
  disabled?: boolean
}

export function OtpInput({
  length = 6,
  onComplete,
  error = false,
  success = false,
  disabled = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const shakeVariants = {
    shake: {
      x: [-8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    idle: { x: 0 },
  }

  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index]
    if (el) el.focus()
  }, [])

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const digit = val.slice(-1)
    const newValues = [...values]
    newValues[index] = digit
    setValues(newValues)

    if (digit && index < length - 1) {
      focusInput(index + 1)
    }

    if (newValues.every((v) => v !== '') && digit) {
      onComplete(newValues.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index]) {
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
      } else if (index > 0) {
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const newValues = [...values]
    pasted.split('').forEach((char, i) => {
      newValues[i] = char
    })
    setValues(newValues)
    const nextFocus = Math.min(pasted.length, length - 1)
    focusInput(nextFocus)
    if (pasted.length === length) {
      onComplete(pasted)
    }
  }

  useEffect(() => {
    focusInput(0)
  }, [focusInput])

  return (
    <motion.div
      className="flex gap-3 justify-center"
      variants={shakeVariants}
      animate={error ? 'shake' : 'idle'}
    >
      {values.map((val, index) => (
        <motion.div
          key={index}
          animate={
            success
              ? {
                  scale: [1, 1.08, 1],
                  transition: { duration: 0.3, delay: index * 0.08 },
                }
              : { scale: 1 }
          }
        >
          <input
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Chiffre ${index + 1} du code`}
            className={cn(
              'w-11 h-[52px] text-center text-[22px] font-semibold rounded-lg border outline-none transition-all duration-200',
              'bg-neutral-900 text-white caret-transparent',
              // Normal
              !error && !success && 'border-slate-700/80 focus:border-[#3758f9] focus:ring-2 focus:ring-[#3758f9]/20',
              // Erreur
              error && 'border-red-500/70 bg-red-500/10 text-red-200',
              // Succès
              success && 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200',
              disabled && 'opacity-40 cursor-not-allowed',
            )}
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
