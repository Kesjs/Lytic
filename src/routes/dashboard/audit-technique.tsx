import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Copy,
  Gauge,
  Loader2,
} from 'lucide-react'
import { fetchDashboardHome } from '~/lib/queries/dashboard'
import { fetchBotAccess } from '~/lib/queries/bot-access'
import { AuditScoreHistory } from '~/components/dashboard/AuditScoreHistory'
import { IA_BOTS } from '~/lib/crawler/constants'
import { useTechnicalAuditCheck } from '~/lib/hooks/useTechnicalAuditCheck'
import { DashboardStateView } from '~/components/dashboard/DashboardState'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'
import {
  computeAuditMetrics,
  buildAuditRows,
  getAuditFixes,
  ITEM_POINTS,
  type AuditRow,
  type AuditRowKey,
} from '~/components/dashboard/TechnicalAuditCard'

export const Route = createFileRoute('/dashboard/audit-technique')({
  component: AuditTechniquePage,
})

// Regroupement éditorial des items — différent de l'ordre de calcul du score,
// pensé pour que l'utilisateur avance dans un ordre logique de correction.
const GROUPS: { title: string; keys: AuditRowKey[] }[] = [
  { title: 'Découvrabilité par les IA', keys: ['bots', 'llms'] },
  { title: 'Structure & balisage', keys: ['jsonld', 'h1', 'titleMeta', 'canonical'] },
  { title: 'Contenu accessible', keys: ['altImages'] },
]

function AuditTechniquePage() {
  const { data, isLoading: isDashLoading } = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: () => fetchDashboardHome(),
  })
  const { data: botAccess, isLoading: isBotLoading } = useQuery({
    queryKey: ['bot-access'],
    queryFn: () => fetchBotAccess(),
  })

  const brandId = data?.brand?.id
  const { runAudit, isRunning } = useTechnicalAuditCheck(brandId ?? '')

  const metrics = useMemo(
    () => (botAccess ? computeAuditMetrics(botAccess, data?.pages ?? []) : null),
    [botAccess, data?.pages],
  )

  // Ouverture + scroll auto sur l'item pointé par le lien "Voir le correctif"
  // (hash de l'URL, ex. #jsonld) depuis la carte compacte de l'Accueil.
  const hash = useRouterState({ select: (s) => s.location.hash })
  const [openKey, setOpenKey] = useState<AuditRowKey | null>(null)
  const itemRefs = useRef<Partial<Record<AuditRowKey, HTMLDivElement | null>>>({})

  useEffect(() => {
    if (!hash) return
    const key = hash as AuditRowKey
    if (key in ITEM_POINTS) {
      setOpenKey(key)
      // Laisse le temps au contenu réel de remplacer le skeleton avant de scroller.
      const t = setTimeout(() => {
        itemRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
      return () => clearTimeout(t)
    }
  }, [hash, metrics])

  if (isDashLoading || isBotLoading) {
    return <AuditTechniqueSkeleton />
  }

  if (!data?.brand) {
    return (
      <DashboardStateView
        state="no_data"
        title="Aucune marque configurée"
        description="Ajoutez votre marque dans Paramètres pour lancer votre premier audit technique."
      />
    )
  }

  if (!botAccess || !metrics) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-base font-semibold text-ink-primary">Audit technique IA</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Reflet peut vérifier si votre site est techniquement optimisé pour les IA
          (accès bots, llms.txt, balisage Schema.org, structure H1...).
        </p>
        <button
          type="button"
          onClick={runAudit}
          disabled={isRunning}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50"
        >
          {isRunning && <Loader2 className="size-3.5 animate-spin" />}
          {isRunning ? 'Audit en cours…' : "Lancer l'audit"}
        </button>
      </div>
    )
  }

  const rows = buildAuditRows(metrics, botAccess.llmsTxtFound)
  const rowByKey = Object.fromEntries(rows.map((r) => [r.key, r])) as Record<AuditRowKey, AuditRow>
  // Correctifs personnalisés avec la vraie URL de la page auditée (plutôt que
  // le placeholder générique "votresite.com") quand elle est disponible.
  const fixes = getAuditFixes(metrics.pageUrl)
  const { score } = metrics
  const scoreColor = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger'

  const allowedBotsCount = IA_BOTS.filter((bot) => botAccess.bots[bot.id] === 'allowed').length
  const blockedBotsCount = IA_BOTS.filter((bot) => botAccess.bots[bot.id] === 'blocked').length
  const botsPassed = blockedBotsCount === 0 && allowedBotsCount === IA_BOTS.length

  const failedCount = rows.filter((r) => !r.passed).length + (botsPassed ? 0 : 1)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink-primary">Audit technique IA</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {failedCount > 0
              ? `${failedCount} point${failedCount > 1 ? 's' : ''} à corriger pour améliorer votre visibilité IA.`
              : 'Tous les points techniques sont au vert.'}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Dernier audit : {new Date(botAccess.checkedAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Gauge className={cn('size-4', scoreColor)} />
            <span className={cn('text-lg font-bold', scoreColor)}>{score}/100</span>
          </div>
          <button
            type="button"
            onClick={runAudit}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-md bg-elevated px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50 border border-border"
          >
            {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Gauge className="size-3.5" />}
            Re-tester
          </button>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink-primary">Évolution du score technique</h2>
        <AuditScoreHistory />
      </div>

      {/* Robots IA — traité à part car c'est un groupe de bots, pas un item unique */}
      <AuditGroup title="Découvrabilité par les IA">
        <AuditItemCard
          itemKey="bots"
          passed={botsPassed}
          label={`Robots IA : ${allowedBotsCount}/${IA_BOTS.length} autorisés`}
          why="Un robot IA bloqué ne peut simplement pas lire votre site — c'est la base avant tout le reste."
          detail={metrics.pageUrl ? `Vérifié sur ${metrics.pageUrl}` : undefined}
          fixes={fixes}
          isOpen={openKey === 'bots'}
          onToggle={() => setOpenKey((k) => (k === 'bots' ? null : 'bots'))}
          setRef={(el) => (itemRefs.current.bots = el)}
          extra={
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {IA_BOTS.map((bot) => {
                const status = botAccess.bots[bot.id] ?? 'unknown'
                return (
                  <div key={bot.id} className="flex items-center gap-1.5">
                    <StatusIcon status={status} />
                    <span className="text-xs text-ink-primary">{bot.label}</span>
                  </div>
                )
              })}
            </div>
          }
        />
        <AuditItemCard
          itemKey="llms"
          passed={rowByKey.llms.passed}
          label={rowByKey.llms.label}
          why={rowByKey.llms.why}
          detail={rowByKey.llms.detail}
          fixes={fixes}
          isOpen={openKey === 'llms'}
          onToggle={() => setOpenKey((k) => (k === 'llms' ? null : 'llms'))}
          setRef={(el) => (itemRefs.current.llms = el)}
        />
      </AuditGroup>

      <AuditGroup title="Structure & balisage">
        {(['jsonld', 'h1', 'titleMeta', 'canonical'] as AuditRowKey[]).map((key) => (
          <AuditItemCard
            key={key}
            itemKey={key}
            passed={rowByKey[key].passed}
            label={rowByKey[key].label}
            why={rowByKey[key].why}
            detail={rowByKey[key].detail}
            fixes={fixes}
            isOpen={openKey === key}
            onToggle={() => setOpenKey((k) => (k === key ? null : key))}
            setRef={(el) => (itemRefs.current[key] = el)}
          />
        ))}
      </AuditGroup>

      <AuditGroup title="Contenu accessible">
        <AuditItemCard
          itemKey="altImages"
          passed={rowByKey.altImages.passed}
          label={rowByKey.altImages.label}
          why={rowByKey.altImages.why}
          detail={rowByKey.altImages.detail}
          fixes={fixes}
          isOpen={openKey === 'altImages'}
          onToggle={() => setOpenKey((k) => (k === 'altImages' ? null : 'altImages'))}
          setRef={(el) => (itemRefs.current.altImages = el)}
        />
      </AuditGroup>
    </div>
  )
}

function AuditGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  )
}

function AuditItemCard({
  itemKey,
  passed,
  label,
  why,
  detail,
  fixes,
  isOpen,
  onToggle,
  setRef,
  extra,
}: {
  itemKey: AuditRowKey
  passed: boolean
  label: string
  why: string
  detail?: string
  fixes: ReturnType<typeof getAuditFixes>
  isOpen: boolean
  onToggle: () => void
  setRef: (el: HTMLDivElement | null) => void
  extra?: React.ReactNode
}) {
  const [showCode, setShowCode] = useState(false)
  const fix = fixes[itemKey]

  return (
    <div
      ref={setRef}
      className={cn(
        'rounded-md border px-3.5 py-3 transition-colors scroll-mt-4',
        isOpen ? 'border-brand/40 bg-brand/5' : 'border-border',
      )}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-2 text-left">
        <StatusIcon status={passed ? 'allowed' : 'blocked'} />
        <span className="flex-1 text-sm text-ink-primary">{label}</span>
        {!passed && (
          <span className="shrink-0 text-[10.5px] font-medium text-ink-muted">
            +{ITEM_POINTS[itemKey]} pts
          </span>
        )}
        <ChevronDown className={cn('size-4 shrink-0 text-ink-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 pl-6">
          <p className="text-xs text-ink-secondary">{why}</p>
          {detail && (
            <p className="rounded bg-elevated/60 px-2 py-1 text-[11px] text-ink-muted break-words">{detail}</p>
          )}
          {extra}
          {!passed && fix && (
            <div className="space-y-2 rounded-md bg-elevated/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Correctif</p>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-ink-secondary">
                {fix.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {fix.snippet && !showCode && (
                <button
                  type="button"
                  onClick={() => setShowCode(true)}
                  className="mt-2 text-xs text-brand-text hover:underline font-medium flex items-center gap-1"
                >
                  Voir le code à envoyer à votre développeur →
                </button>
              )}
              {fix.snippet && showCode && <CodeSnippet label={fix.snippetLabel} code={fix.snippet} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CodeSnippet({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copié')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  return (
    <div>
      {label && <p className="mb-1 text-[11px] text-ink-muted">{label}</p>}
      <div className="relative">
        <pre className="overflow-x-auto rounded-md border border-border bg-surface p-3 text-[11px] leading-relaxed text-ink-primary">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-elevated px-1.5 py-1 text-[10.5px] font-medium text-ink-secondary hover:text-ink-primary"
        >
          <Copy className="size-3" />
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: 'allowed' | 'blocked' | 'unknown' }) {
  if (status === 'allowed') return <CheckCircle2 className="size-4 shrink-0 text-success" />
  if (status === 'blocked') return <XCircle className="size-4 shrink-0 text-danger" />
  return <HelpCircle className="size-4 shrink-0 text-warning" />
}

function AuditTechniqueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-64" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-3 space-y-2.5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
