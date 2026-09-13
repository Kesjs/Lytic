import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabaseBrowserClient } from '~/lib/supabase/client'

const navLinks = [
  { label: 'Produit', href: '/#produit' },
  { label: 'Questions', href: '/#questions' },
  { label: 'Preuves', href: '/#preuves' },
  { label: 'Tarifs', href: '/#tarifs' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
    <header className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl">
      {/* Barre flottante en verre dépoli (Frosted Glass Pill) */}
      <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-[#121215]/85 px-5 backdrop-blur-xl shadow-2xl shadow-black/80 transition-all duration-200">
        {/* Logo Monogramme Reflet */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-[#c9ab1e] text-xs font-black text-black">
            R
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Reflet</span>
        </Link>

        {/* Liens de navigation Desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Boutons d'accès Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-[#c9ab1e] px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-[#b89a18] hover:shadow-[0_0_16px_rgba(201,171,30,0.3)]"
            >
              Dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Connexion
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-[#c9ab1e] px-4 py-1.5 text-xs font-semibold text-black transition-all hover:bg-[#b89a18] hover:shadow-[0_0_16px_rgba(201,171,30,0.3)]"
              >
                Commencer
              </Link>
            </>
          )}
        </div>

        {/* Bouton Burger Mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex size-8 items-center justify-center rounded-full text-zinc-300 hover:text-white md:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Menu Déroulant Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/95 p-4 backdrop-blur-2xl shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 border-t border-white/10 pt-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9ab1e] py-2.5 text-center text-xs font-semibold text-black"
                  >
                    Accéder au Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="rounded-xl border border-white/10 py-2 text-center text-xs font-medium text-zinc-300 hover:bg-white/5"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-xl bg-[#c9ab1e] py-2.5 text-center text-xs font-semibold text-black"
                    >
                      Commencer
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
