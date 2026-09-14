import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import type { BotAccessData } from '~/lib/queries/bot-access'
import { IA_BOTS } from '~/lib/crawler/robots'

interface Props {
  data: BotAccessData | null
}

export function BotAccessCard({ data }: Props) {
  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-primary">Accès Bots IA</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Aucune analyse effectuée. Lancez une mesure pour vérifier si les bots d'IA peuvent crawler votre site.
        </p>
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
