import { MessageSquare, Bot, Eye, Link2, Activity, Lightbulb, ChevronRight, ChevronDown } from 'lucide-react'

const chain = [
  { label: 'Question', icon: MessageSquare, desc: 'Intention visée' },
  { label: 'Réponse', icon: Bot, desc: 'Sortie brute de l\'IA' },
  { label: 'Observation', icon: Eye, desc: 'Fait extrait' },
  { label: 'Preuves', icon: Link2, desc: 'Source sur le site' },
  { label: 'Constat', icon: Activity, desc: 'Diagnostic posé' },
  { label: 'Opportunité', icon: Lightbulb, desc: 'Action recommandée' },
]

export function Evidence() {
  return (
    <section id="preuves" className="bg-canvas px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Pas de score sans preuve.
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Chaque insight peut être remonté à la source. Une traçabilité totale, vérifiable à chaque étape.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="flex flex-col items-center lg:flex-row lg:justify-between lg:items-stretch lg:gap-2">
            {chain.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="flex flex-col items-center lg:flex-row lg:gap-2">
                  
                  {/* Card */}
                  <div className="group relative flex w-64 flex-col items-center rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-elevated hover:shadow-xl hover:shadow-brand/10 lg:w-40 lg:p-4">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-elevated border border-border text-ink-muted transition-colors group-hover:text-brand-text group-hover:border-brand/20 lg:h-10 lg:w-10 lg:mb-3">
                      <Icon className="size-6 lg:size-5" />
                    </div>
                    <p className="text-base font-semibold text-ink-primary text-center lg:text-sm">{step.label}</p>
                    <p className="mt-1.5 text-sm text-ink-secondary text-center lg:text-[11px] lg:mt-1">{step.desc}</p>
                  </div>

                  {/* Connector */}
                  {i < chain.length - 1 && (
                    <div className="my-4 flex items-center justify-center text-border lg:my-0 lg:mx-0.5">
                      <ChevronDown className="size-6 lg:hidden" />
                      <ChevronRight className="hidden size-5 lg:block" />
                    </div>
                  )}
                  
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
