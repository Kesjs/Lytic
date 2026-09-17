import { motion } from 'framer-motion'
import { useTranslation } from '~/lib/i18n/LanguageContext'

export function LanguageSwitcher() {
  const { lang, setLang } = useTranslation()

  return (
    <div className="relative flex items-center rounded-full border border-border/50 bg-surface p-1 shadow-sm">
      <button
        onClick={() => setLang('fr')}
        className={`relative z-10 w-10 py-1 text-[11px] font-medium transition-colors ${
          lang === 'fr' ? 'text-black' : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLang('en')}
        className={`relative z-10 w-10 py-1 text-[11px] font-medium transition-colors ${
          lang === 'en' ? 'text-black' : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        EN
      </button>

      {/* Animated pill background */}
      <motion.div
        className="absolute bottom-1 top-1 w-10 rounded-full bg-brand"
        initial={false}
        animate={{
          x: lang === 'en' ? 40 : 0, // 40 is the width of one button (w-10 = 40px)
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    </div>
  )
}
