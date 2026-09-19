import { cn } from "~/lib/utils"
import { Settings, Activity, Lightbulb, Github, Cloud, Slack, FileText, TrendingUp, CheckCircle2 } from "lucide-react"
import type React from "react"
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { ScreenshotFrame } from "./ScreenshotFrame"

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  step: number
  icon: React.ReactNode
  title: string
  description: string
  benefits: string[]
  visual: React.ReactNode
  className?: string
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  icon,
  title,
  description,
  benefits,
  visual,
  className,
}) => (
  <div
    className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border border-hairline border-border bg-surface p-6 text-ink-primary transition-all duration-300 ease-in-out",
      "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 hover:border-brand/30 hover:bg-elevated",
      className
    )}
  >
    {/* Ambient glow au survol */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-brand/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
    />

    <div className="relative z-10 flex items-center gap-2 mb-4">
      <span className="rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-text">
        Étape {step}
      </span>
    </div>

    <div className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-elevated text-brand-text border border-border">
      {icon}
    </div>

    <h3 className="relative z-10 mb-2 text-xl font-semibold text-ink-primary">{title}</h3>
    <p className="relative z-10 mb-6 text-sm text-ink-secondary leading-relaxed">{description}</p>

    {/* Zone visuelle décorative type bento */}
    <div className="relative z-10 mb-6 flex min-h-[120px] flex-1 items-center justify-center rounded-xl border border-hairline border-border bg-canvas/60 p-4 overflow-hidden">
      {visual}
    </div>

    <ul className="relative z-10 space-y-3">
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

// --- Visuels décoratifs pour chaque étape (style bento, inspiré du shot Dribbble) ---

const OnboardingVisual: React.FC = () => (
  <div className="relative flex h-full w-full items-center justify-center">
    <div
      aria-hidden="true"
      className="absolute h-20 w-20 rounded-full bg-brand/10 blur-xl"
    />
    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 bg-elevated text-brand-text shadow-[0_0_20px_-4px_rgba(201,171,30,0.4)]">
      <Cloud className="size-5" />
    </div>
    <div aria-hidden="true" className="absolute h-full w-full">
      {[Github, Slack, Cloud].map((Icon, i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
        const radius = 44
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <span
            key={i}
            className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-secondary"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
          >
            <Icon className="size-3.5" />
          </span>
        )
      })}
      <svg className="absolute inset-0 h-full w-full" viewBox="-60 -60 120 120" aria-hidden="true">
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
          const radius = 44
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={x}
              y2={y}
              stroke="rgb(var(--color-border-strong))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )
        })}
      </svg>
    </div>
  </div>
)

const MeasureVisual: React.FC = () => (
  <div className="flex w-full flex-col items-center gap-3">
    <div className="flex items-center gap-2 rounded-full border border-brand/30 bg-elevated px-3 py-1.5 text-xs font-medium text-brand-text shadow-[0_0_20px_-6px_rgba(201,171,30,0.5)]">
      <TrendingUp className="size-3.5" />
      Score de visibilité : 78%
    </div>
    <div className="flex w-full items-end justify-center gap-1.5">
      {[40, 65, 50, 80, 60, 90].map((h, i) => (
        <div
          key={i}
          className="w-3 rounded-t-sm bg-brand/60 transition-all group-hover:bg-brand-text/80"
          style={{ height: `${h * 0.4}px` }}
        />
      ))}
    </div>
  </div>
)

const ActionVisual: React.FC = () => (
  <div className="flex w-full flex-col items-center gap-3">
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-secondary w-full max-w-[200px]">
      <FileText className="size-3.5 text-ink-muted flex-shrink-0" />
      <span className="truncate">Recommandation priorisée</span>
    </div>
    <button
      type="button"
      tabIndex={-1}
      className="pointer-events-none flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-canvas shadow-[0_0_20px_-4px_rgba(201,171,30,0.6)]"
    >
      <CheckCircle2 className="size-3.5" />
      Corriger maintenant
    </button>
  </div>
)

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const { t } = useTranslation()
  const stepsData = [
    {
      icon: <Settings className="size-5" />,
      visual: <OnboardingVisual />,
      ...t.howItWorks.steps[0],
    },
    {
      icon: <Activity className="size-5" />,
      visual: <MeasureVisual />,
      ...t.howItWorks.steps[1],
    },
    {
      icon: <Lightbulb className="size-5" />,
      visual: <ActionVisual />,
      ...t.howItWorks.steps[2],
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
          <span className="mb-3 inline-block text-xs font-mono uppercase tracking-wider text-brand-text">
            Comment ça marche
          </span>
          <h2 className="text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            {t.howItWorks.heading}
          </h2>
          <p className="mt-4 text-lg text-ink-secondary">
            {t.howItWorks.subheading}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              step={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
              visual={step.visual}
            />
          ))}
        </div>

        {/* Showcase de l'écran Opportunités */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-text">{t.howItWorks.opportunities.tag}</span>
            <h3 className="mt-2 text-2xl font-medium tracking-tight text-ink-primary sm:text-3xl">
              {t.howItWorks.opportunities.heading}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
              {t.howItWorks.opportunities.description}
            </p>
          </div>
          <ScreenshotFrame
            label={t.howItWorks.opportunities.previewLabel}
            src="/images/dashboard/opportunities.png"
            urlPath="app.reflet.io/dashboard/opportunites"
            glow
            badge={t.howItWorks.opportunities.previewBadge}
          />
        </div>
      </div>
    </section>
  )
}
