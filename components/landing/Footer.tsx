import Link from 'next/link'

const columns = [
  { title: 'Produit', links: ['Vue d’ensemble', 'Visibilité IA', 'Questions et mesures', 'Preuves et opportunités', 'Historique du site'] },
  { title: 'Ressources', links: ['Blog', 'Guides', 'Études', 'Glossaire'] },
  { title: 'Entreprise', links: ['À propos', 'Contact'] },
  { title: 'Légal', links: ['Confidentialité', 'Conditions'] },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-1200">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-ink-primary">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-ink-secondary transition-colors hover:text-ink-primary">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 border-t border-border pt-8">
          <p className="text-xs text-ink-muted">© 2026 Reflet — Mesurer. Comprendre. Améliorer.</p>
        </div>
      </div>
    </footer>
  )
}
