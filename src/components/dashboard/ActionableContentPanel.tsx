import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Check, Code, FileText, Settings, Loader2, Sparkles } from 'lucide-react'
import { generateActionableContent, type ActionableContent, type SiteContent } from '~/lib/actionable-content'
import { isFreePlan } from '~/lib/plan'

interface Props {
  opportunity: {
    title: string
    reason: string
    proposed_direction?: string | null
    website_url?: string | null
  }
  siteContent: SiteContent | null
  brandPlan: string
}

export function ActionableContentPanel({ opportunity, siteContent, brandPlan }: Props) {
  const [copied, setCopied] = useState(false)
  const plan = isFreePlan(brandPlan) ? 'free' : 'pro'

  const { data: actionable, isLoading } = useQuery({
    queryKey: ['actionable-content', opportunity.title, opportunity.reason, opportunity.proposed_direction],
    queryFn: () => generateActionableContent(opportunity, siteContent, plan),
    enabled: !!opportunity,
  })

  if (!actionable && !isLoading) return null

  const handleCopy = async () => {
    if (actionable) {
      await navigator.clipboard.writeText(actionable.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getIcon = () => {
    switch (actionable?.type) {
      case 'robots_txt':
      case 'llms_txt':
        return <FileText className="w-4 h-4" />
      case 'json_ld':
        return <Code className="w-4 h-4" />
      case 'meta_description':
        return <Settings className="w-4 h-4" />
      default:
        return <Copy className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Génération du contenu personnalisé...</span>
        </div>
      </div>
    )
  }

  if (!actionable) return null

  return (
    <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-ink-primary">{actionable.label}</span>
          {plan === 'pro' && (
            <div className="flex items-center gap-1 text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>IA personnalisé</span>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-brand text-white hover:bg-brand/90"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copié
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copier
            </>
          )}
        </button>
      </div>

      <pre className="p-3 bg-canvas rounded text-xs text-ink-secondary overflow-x-auto whitespace-pre-wrap">
        {actionable.content}
      </pre>

      {actionable.instructions && (
        <p className="mt-3 text-xs text-ink-muted">
          💡 {actionable.instructions}
        </p>
      )}
    </div>
  )
}
