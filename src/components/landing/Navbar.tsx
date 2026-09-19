import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'
import logoUrl from '~/assets/reflet-horizontal-dark.svg'
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
    <div 
      ref={ref} 
      className="relative" 
      onMouseEnter={() => setOpen(true)} 
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        className="flex items-center gap-1.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
      >
        {label}
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 border border-border bg-canvas p-1.5 shadow-sm">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary focus:bg-surface focus:text-ink-primary focus:outline-none"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
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
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
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
      )}
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
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-border bg-canvas' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-1200 items-center justify-between px-6 transition-all duration-300 ${
          scrolled ? 'h-16' : 'h-24'
        }`}
      >
        <Link to="/" className="flex items-center">
          <img src={logoUrl} alt="Reflet" className="h-12" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-6">
            <NavDropdown label={t.navbar.product} items={productItems} />
            <NavDropdown label={t.navbar.resources} items={resourceItems} />
            <a href="#tarifs" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">
              {t.navbar.pricing}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="group relative p-[1px] transition-colors duration-200 bg-ink-primary hover:bg-ink-primary/80 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                {/* Wrapper pour simuler la bordure avec clip-path (Dashboard) */}
                <Link
                  to="/dashboard"
                  className="flex h-full w-full items-center gap-2 bg-ink-primary px-4 py-2 text-sm font-medium text-canvas transition-colors group-hover:bg-canvas group-hover:text-ink-primary [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
                >
                  {t.navbar.dashboard}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">
                  {t.navbar.login}
                </Link>
                {/* Wrapper pour simuler la bordure avec clip-path (Start/S'inscrire) */}
                <div className="group relative p-[1px] transition-colors duration-200 bg-brand hover:bg-brand-hover [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                  <Link
                    to="/login"
                    className="flex h-full w-full items-center gap-2 bg-brand px-4 py-2 text-sm font-medium text-black transition-colors group-hover:bg-canvas group-hover:text-brand [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
                  >
                    {t.navbar.start}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="text-ink-primary md:hidden" aria-label="Menu">
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-canvas md:hidden">
          <div className="flex flex-col px-6 py-4">
            <MobileNavGroup label={t.navbar.product} items={productItems} onNavigate={() => setMobileOpen(false)} />
            <MobileNavGroup label={t.navbar.resources} items={resourceItems} onNavigate={() => setMobileOpen(false)} />
            <a
              href="#tarifs"
              onClick={() => setMobileOpen(false)}
              className="border-b border-border/60 py-3 text-sm font-medium text-ink-secondary hover:text-ink-primary"
            >
              {t.navbar.pricing}
            </a>

            <div className="mt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <div className="group w-full relative p-[1px] transition-colors duration-200 bg-ink-primary hover:bg-ink-primary/80 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                  {/* Wrapper Dashboard Mobile */}
                  <Link
                    to="/dashboard"
                    className="flex w-full items-center justify-center gap-2 bg-ink-primary px-4 py-3 text-sm font-medium text-canvas transition-colors group-hover:bg-canvas group-hover:text-ink-primary [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
                  >
                    {t.navbar.goToDashboard}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center py-2 text-sm font-medium text-ink-secondary hover:text-ink-primary"
                  >
                    {t.navbar.login}
                  </Link>
                  {/* Wrapper Start Mobile */}
                  <div className="group w-full relative p-[1px] transition-colors duration-200 bg-brand hover:bg-brand-hover [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                    <Link
                      to="/login"
                      className="flex w-full items-center justify-center gap-2 bg-brand px-4 py-3 text-sm font-medium text-black transition-colors group-hover:bg-canvas group-hover:text-brand [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
                    >
                      {t.navbar.start}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
