import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import logoUrl from '~/assets/reflet-horizontal-dark.svg'
import { LanguageSwitcher } from '~/components/ui/LanguageSwitcher'
import { useTranslation } from '~/lib/i18n/LanguageContext'

function NavDropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 py-2 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
      >
        {label}
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-hairline border-border bg-elevated p-1.5 shadow-xl shadow-black/40"
          >
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Groupe repliable pour le menu mobile — reproduit le regroupement des
// dropdowns desktop (Produit / Ressources) au lieu d'afficher les 9 liens
// à plat, qui rendait le menu mobile trop long et peu lisible.
function MobileNavGroup({ label, items, onNavigate }: { label: string; items: { label: string; href: string }[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pb-3 pl-3">
              {items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className="py-2 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Listes partagées entre le dropdown desktop et l'accordéon mobile, pour
  // ne jamais les laisser diverger.
  const productItems = [
    { label: t.navbar.productOverview, href: '/#produit' },
    { label: t.navbar.productAiVisibility, href: '/#produit' },
    { label: t.navbar.productQuestions, href: '/#questions' },
    { label: t.navbar.productEvidence, href: '/#preuves' },
    { label: t.navbar.productHistory, href: '/#historique' },
  ]
  const resourceItems = [
    { label: t.navbar.resourcesBlog, href: '#' },
    { label: t.navbar.resourcesGuides, href: '#' },
    { label: t.navbar.resourcesStudies, href: '#' },
    { label: t.navbar.resourcesGlossary, href: '#' },
  ]

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setIsAuthenticated(true)
      }
    }).catch(() => {})

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? 'border-b border-hairline border-border bg-canvas/80 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-1200 items-center justify-between px-6 transition-all duration-500 ${
          scrolled ? 'h-16' : 'h-24'
        }`}
      >
        <Link to="/" className="flex items-center">
          <img src={logoUrl} alt="Reflet" className="h-12" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavDropdown label={t.navbar.product} items={productItems} />
          <NavDropdown label={t.navbar.resources} items={resourceItems} />
          <a href="#tarifs" className="text-sm text-ink-secondary transition-colors hover:text-ink-primary">
            {t.navbar.pricing}
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-brand-hover"
            >
              {t.navbar.dashboard}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm text-ink-secondary transition-colors hover:text-ink-primary">
                {t.navbar.login}
              </Link>
              <Link
                to="/login"
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-hover"
              >
                {t.navbar.start}
              </Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="text-ink-primary md:hidden" aria-label="Menu">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border bg-canvas md:hidden"
          >
            <div className="flex flex-col px-6 py-4">
              <div className="mb-4">
                <LanguageSwitcher />
              </div>

              {/* Regroupé comme sur desktop (Produit / Ressources) au lieu
                  d'une liste à plat de 9 liens. */}
              <MobileNavGroup label={t.navbar.product} items={productItems} onNavigate={() => setMobileOpen(false)} />
              <MobileNavGroup label={t.navbar.resources} items={resourceItems} onNavigate={() => setMobileOpen(false)} />
              <a
                href="#tarifs"
                onClick={() => setMobileOpen(false)}
                className="border-b border-border/60 py-3 text-sm text-ink-secondary hover:text-ink-primary"
              >
                {t.navbar.pricing}
              </a>

              <div className="mt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover"
                  >
                    {t.navbar.goToDashboard}
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center py-2 text-sm text-ink-secondary hover:text-ink-primary"
                    >
                      {t.navbar.login}
                    </Link>
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover"
                    >
                      {t.navbar.start}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
