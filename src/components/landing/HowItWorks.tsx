import { cn } from "~/lib/utils"
import { Settings, Activity, Lightbulb } from "lucide-react"
import type React from "react"

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode
  title: string
  description: string
  benefits: string[]
}

const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      "relative rounded-xl border border-hairline border-border bg-surface p-6 text-ink-primary transition-all duration-300 ease-in-out",
      "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 hover:border-brand/30 hover:bg-elevated"
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-elevated text-brand-text border border-border">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-ink-primary">{title}</h3>
    <p className="mb-6 text-sm text-ink-secondary leading-relaxed">{description}</p>
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand/10">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-text"></div>
          </div>
          <span className="text-sm text-ink-muted">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
)

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const stepsData = [
    {
      icon: <Settings className="size-5" />,
      title: "Onboarding intelligent",
      description:
        "Renseignez votre domaine. Reflet analyse votre site et génère automatiquement les questions les plus stratégiques.",
      benefits: [
        "Génération des intentions par l'IA",
        "Ciblage sémantique ultra-précis",
        "Aucun paramétrage complexe requis",
      ],
    },
    {
      icon: <Activity className="size-5" />,
      title: "Mesure et Analyse",
      description:
        "Notre moteur interroge régulièrement les LLMs et croise leurs réponses avec l'évolution de vos pages web.",
      benefits: [
        "Score clair de visibilité et recommandation",
        "Détection déterministe des changements (0€)",
        "Analyse de sentiment automatisée",
      ],
    },
    {
      icon: <Lightbulb className="size-5" />,
      title: "Actionnez les opportunités",
      description:
        "Obtenez des recommandations claires (avant/après) pour corriger vos lacunes et hacker l'algorithme des LLMs.",
      benefits: [
        "Preuves techniques détaillées",
        "Comparaison avec la concurrence",
        "Maintien de votre avantage compétitif",
      ],
    },
  ]

  return (
    <section
      id="how-it-works"
      className={cn("w-full bg-canvas py-24", className)}
      {...props}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            Comment ça fonctionne
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            Vous choisissez les questions. Notre moteur s'occupe du reste.
          </p>
        </div>

        <div className="relative mx-auto mb-12 w-full max-w-5xl hidden md:block">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-px w-[66.6667%] -translate-y-1/2 bg-border"
          />
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-surface font-semibold text-ink-primary ring-4 ring-canvas border border-border"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
