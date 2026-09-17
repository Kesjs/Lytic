import logoUrl from '~/assets/reflet-horizontal-dark.svg'
import { useTranslation } from '~/lib/i18n/LanguageContext'

export function Footer() {
  const { t } = useTranslation()
  
  const columnsData = [
    t.footer.columns.product,
    t.footer.columns.resources,
    t.footer.columns.company,
    t.footer.columns.legal,
  ]

  return (
    <footer className="border-t border-hairline border-border px-6 py-16">
      <div className="mx-auto max-w-1200">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columnsData.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-ink-primary">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink-secondary transition-colors hover:text-ink-primary">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logoUrl} alt="Reflet" className="h-7" />
          <p className="text-xs text-ink-muted">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
