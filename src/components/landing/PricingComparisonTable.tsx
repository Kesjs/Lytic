import React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '~/lib/utils'

interface FeatureGroup {
  name: string
  features: {
    name: string
    free: string | boolean
    pro: string | boolean
    enterprise: string | boolean
  }[]
}

const tableData: FeatureGroup[] = [
  {
    name: "Analyse & Tracking",
    features: [
      { name: "Domaines analysés", free: "1", pro: "Jusqu'à 3", enterprise: "Illimité" },
      { name: "Questions suivies", free: "10 requêtes", pro: "100 requêtes", enterprise: "Sur mesure" },
      { name: "Fréquence d'interrogation", free: "Mensuelle", pro: "Hebdomadaire", enterprise: "Quotidienne" },
      { name: "Historique des données", free: "30 jours", pro: "1 an", enterprise: "Illimité" },
    ]
  },
  {
    name: "Fonctionnalités IA",
    features: [
      { name: "Score global de visibilité", free: true, pro: true, enterprise: true },
      { name: "Recommandations d'actions", free: "Limité (Top 3)", pro: true, enterprise: true },
      { name: "Analyse concurrentielle", free: false, pro: true, enterprise: true },
      { name: "Alertes de changement d'algorithme", free: false, pro: true, enterprise: true },
      { name: "Export PDF en marque blanche", free: false, pro: false, enterprise: true },
    ]
  },
  {
    name: "Support & Accès",
    features: [
      { name: "Support client", free: "Communauté", pro: "Prioritaire (24h)", enterprise: "Gestionnaire dédié" },
      { name: "Accès API", free: false, pro: false, enterprise: true },
      { name: "SSO (Single Sign-On)", free: false, pro: false, enterprise: true },
    ]
  }
]

function CellValue({ value, isPro }: { value: string | boolean, isPro?: boolean }) {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className="flex justify-center">
          <div className={cn(
            "flex size-6 items-center justify-center rounded-full bg-surface border shadow-sm",
            isPro ? "border-brand/30 text-brand" : "border-border/50 text-ink-primary"
          )}>
            <Check className="size-3.5" />
          </div>
        </div>
      )
    }
    return (
      <div className="flex justify-center text-ink-muted">
        <Minus className="size-4 opacity-50" />
      </div>
    )
  }
  return (
    <span className={cn(
      "text-sm font-medium",
      isPro ? "text-ink-primary" : "text-ink-secondary"
    )}>
      {value}
    </span>
  )
}

export function PricingComparisonTable() {
  return (
    <section className="relative px-6 py-24 pb-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center md:text-left">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
            Comparez les plans en détail
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Trouvez la formule exacte qui correspond aux ambitions de votre marque.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-hairline border-border bg-surface/30 shadow-2xl shadow-black/20 backdrop-blur-md">
          {/* Subtle glow behind the table */}
          <div className="absolute top-0 right-[25%] -z-10 h-[300px] w-[300px] rounded-full bg-brand/5 blur-[80px]" />
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr>
                  <th className="w-1/3 min-w-[200px] border-b border-border/50 bg-surface/50 p-6 text-left font-semibold text-ink-primary backdrop-blur-sm">
                    Fonctionnalités
                  </th>
                  <th className="min-w-[140px] border-b border-border/50 bg-surface/50 p-6 text-center text-base font-semibold text-ink-primary backdrop-blur-sm">
                    Free
                  </th>
                  <th className="relative min-w-[140px] border-b border-border/50 bg-brand/[0.03] p-6 text-center text-base font-bold text-ink-primary backdrop-blur-sm">
                    {/* Top highlight border for Pro column */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
                    <span className="flex items-center justify-center gap-2">
                      Pro
                    </span>
                  </th>
                  <th className="min-w-[140px] border-b border-border/50 bg-surface/50 p-6 text-center text-base font-semibold text-ink-primary backdrop-blur-sm">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {tableData.map((group, groupIdx) => (
                  <React.Fragment key={group.name}>
                    {/* Group Header */}
                    <tr>
                      <th
                        colSpan={4}
                        className={cn(
                          "bg-surface/20 px-6 py-3 text-xs font-mono font-semibold uppercase tracking-wider text-ink-secondary",
                          groupIdx !== 0 && "border-t border-border/50"
                        )}
                      >
                        {group.name}
                      </th>
                    </tr>
                    {/* Features */}
                    {group.features.map((feature, idx) => (
                      <tr 
                        key={feature.name} 
                        className="transition-colors hover:bg-surface/30"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-ink-secondary">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CellValue value={feature.free} />
                        </td>
                        <td className="relative px-6 py-4 text-center bg-brand/[0.02]">
                          {/* Vertical borders for Pro column to make it pop slightly */}
                          <div className="absolute inset-y-0 left-0 w-[1px] bg-brand/5" />
                          <div className="absolute inset-y-0 right-0 w-[1px] bg-brand/5" />
                          <CellValue value={feature.pro} isPro />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CellValue value={feature.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
