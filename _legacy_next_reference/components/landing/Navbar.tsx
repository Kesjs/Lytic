'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const productLinks = [
  { label: 'Vue d’ensemble', href: '/#produit' },
  { label: 'Visibilité IA', href: '/#produit' },
  { label: 'Questions et mesures', href: '/#questions' },
  { label: 'Preuves et opportunités', href: '/#preuves' },
  { label: 'Historique du site', href: '/#historique' },
]

const resourceLinks = [
  { label: 'Blog', href: '#' },
  { label: 'Guides', href: '#' },
  { label: 'Études', href: '#' },
  { label: 'Glossaire', href: '#' },
]

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
            className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-border bg-elevated p-1.5 shadow-xl shadow-black/40"
          >
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled ? 'border-b border-border bg-canvas/80 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-1200 items-center justify-between px-6 transition-all duration-200 ${
          scrolled ? 'h-14' : 'h-20'
        }`}
      >
        <Link href="/" className="text-sm font-medium tracking-tight text-ink-primary">
          REFLET
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavDropdown label="Produit" items={productLinks} />
          <NavDropdown label="Ressources" items={resourceLinks} />
          <Link href="#tarifs" className="text-sm text-ink-secondary transition-colors hover:text-ink-primary">
            Tarifs
          </Link>
          <Link href="/dashboard" className="text-sm text-ink-secondary transition-colors hover:text-ink-primary">
            Dashboard
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-3 py-2 text-sm text-ink-secondary transition-colors hover:text-ink-primary">
            Connexion
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-brand-hover"
          >
            Commencer
          </Link>
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
            <div className="flex flex-col gap-1 px-6 py-4">
              {[...productLinks, ...resourceLinks].map((item) => (
                <Link key={item.label} href={item.href} className="py-2 text-sm text-ink-secondary hover:text-ink-primary">
                  {item.label}
                </Link>
              ))}
              <Link href="#tarifs" className="py-2 text-sm text-ink-secondary hover:text-ink-primary">
                Tarifs
              </Link>
              <Link href="/dashboard" className="py-2 text-sm text-ink-secondary hover:text-ink-primary">
                Dashboard
              </Link>
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Link href="/login" className="text-sm text-ink-secondary hover:text-ink-primary">
                  Connexion
                </Link>
                <Link href="/login" className="rounded-md bg-brand px-4 py-2 text-center text-sm font-medium text-black">
                  Commencer
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
