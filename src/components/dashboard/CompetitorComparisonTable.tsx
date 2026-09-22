import { CheckCircle2, XCircle, Lock } from 'lucide-react'
import { buildAuditRows, computeAuditMetrics, type AuditRowKey } from '~/components/dashboard/TechnicalAuditCard'
import type { CompetitorRow } from '~/lib/queries/competitors'

type Metrics = NonNullable<ReturnType<typeof computeAuditMetrics>>

interface OwnAudit {
  brandName: string
  metrics: Metrics | null
  llmsTxtFound: boolean
}

// Lignes affichées dans le comparatif — sous-ensemble volontaire de
// ITEM_POINTS : "bots" (accès robots.txt) est déjà couvert ailleurs sur la
// page (badge d'accueil), on garde ce tableau centré sur le balisage propre
// au site (là où la comparaison face à un concurrent a le plus de sens).
const ROWS: { key: AuditRowKey; label: string }[] = [
  { key: 'llms', label: 'llms.txt' },
  { key: 'jsonld', label: 'JSON-LD (Organization)' },
  { key: 'h1', label: 'H1 unique' },
  { key: 'titleMeta', label: 'Titre & meta description' },
  { key: 'canonical', label: 'URL canonique' },
  { key: 'altImages', label: 'Images avec texte alternatif' },
]

export function CompetitorComparisonTable({
  own,
  competitors,
  isFree,
}: {
  own: OwnAudit
  competitors: CompetitorRow[]
  isFree: boolean
}) {
  const scanned = competitors.filter((c) => c.technicalAudit?.metrics)

  if (!own.metrics && scanned.length === 0) return null

  if (isFree) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-5">
        <div aria-hidden="true" className="space-y-2 select-none blur-sm">
          <div className="h-6 w-1/2 rounded bg-elevated" />
          <div className="h-40 rounded bg-elevated" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/70 px-4 text-center">
          <Lock className="size-4 text-ink-muted" />
          <p className="text-sm text-ink-secondary">
            Comparatif technique face à vos concurrents — disponible avec Pro
          </p>
          <a
            href="/dashboard/parametres"
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-hover"
          >
            Débloquer avec Pro
          </a>
        </div>
      </div>
    )
  }

  const columns = [
    {
      label: own.brandName,
      isBrand: true,
      score: own.metrics?.score ?? null,
      rows: own.metrics ? buildAuditRows(own.metrics, own.llmsTxtFound) : null,
    },
    ...scanned.map((c) => ({
      label: c.name,
      isBrand: false,
      score: c.technicalAudit!.metrics!.score,
      rows: buildAuditRows(c.technicalAudit!.metrics as Metrics, c.technicalAudit!.llmsTxtFound),
    })),
  ]

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-ink-primary">Comparatif technique</h2>
      <p className="mb-4 text-xs text-ink-muted">
        Analysé sur la page d'accueil de chaque site — un score plus élevé signifie une structure
        plus lisible pour les IA.
      </p>
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-ink-muted">
            <th className="py-2 pr-3 font-medium">Critère</th>
            {columns.map((col) => (
              <th key={col.label} className="px-3 py-2 text-center font-medium">
                <span className={col.isBrand ? 'text-brand-text' : ''}>{col.label}</span>
                {col.score !== null && <span className="ml-1 text-ink-primary">({col.score}/100)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, label }) => (
            <tr key={key} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 text-ink-secondary">{label}</td>
              {columns.map((col) => {
                const row = col.rows?.find((r) => r.key === key)
                return (
                  <td key={col.label} className="px-3 py-2.5 text-center">
                    {!row ? (
                      <span className="text-ink-muted">—</span>
                    ) : row.passed ? (
                      <CheckCircle2 className="mx-auto size-4 text-green-500" />
                    ) : (
                      <XCircle className="mx-auto size-4 text-ink-muted" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
