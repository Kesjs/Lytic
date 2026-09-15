import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react'
import type { BotAccessData } from '~/lib/queries/bot-access'
import { IA_BOTS } from '~/lib/crawler/constants'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'

interface Props {
  data: BotAccessData | null
  brandId: string
}

export function BotAccessCard({ data, brandId }: Props) {
  const queryClient = useQueryClient()
  const [isChecking, setIsChecking] = useState(false)

  // Même logique que CrawlSection (Paramètres → Site) : on la duplique ici
  // en petit pour que la vérification soit accessible directement depuis
  // cette carte, sans obliger l'utilisateur à aller dans Paramètres.
  const checkMutation = useMutation({
    mutationFn: () => triggerSiteCrawl({ data: { brandId } }),
    onSuccess: async (result) => {
      setIsChecking(true)
      let done = false
      let runId = result.runId

      while (!done) {
        try {
          const res = await processNextPage({ data: { runId } })
          done = res.done
        } catch (err) {
          console.error(err)
          break
        }
      }

      setIsChecking(false)
      queryClient.invalidateQueries({ queryKey: ['bot-access'] })
      toast.success('Vérification des bots IA terminée')
    },
    onError: (err: Error) => {
      setIsChecking(false)
      toast.error(err.message || 'Erreur lors de la vérification')
    },
  })

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Accès Bots IA</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Reflet peut vérifier si les bots des IA (GPTBot, ClaudeBot, Google-Extended...) sont autorisés
          à explorer votre site, via votre robots.txt.
        </p>
        <button
          type="button"
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending || isChecking}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-50"
        >
          {(checkMutation.isPending || isChecking) && <Loader2 className="size-3.5 animate-spin" />}
          {checkMutation.isPending || isChecking ? 'Vérification en cours…' : "Vérifier l'accès"}
        </button>
      </div>
    )
  }

  const { checkedAt, llmsTxtFound, bots } = data

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-primary">Accès Bots IA</h2>
        {llmsTxtFound && (
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
            llms.txt détecté
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {IA_BOTS.map((bot) => {
          const status = bots[bot.id] ?? 'unknown'
          
          return (
            <div key={bot.id} className="flex items-center gap-2">
              <StatusIcon status={status} />
              <span className="text-xs text-ink-primary" title={bot.id}>{bot.label}</span>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Vérifié le {new Date(checkedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  )
}

function StatusIcon({ status }: { status: 'allowed' | 'blocked' | 'unknown' }) {
  if (status === 'allowed') {
    return <CheckCircle2 className="size-4 text-success" />
  }
  if (status === 'blocked') {
    return <XCircle className="size-4 text-danger" />
  }
  return <HelpCircle className="size-4 text-ink-muted" />
}
