import { cn } from "~/lib/utils"
import { Settings, Activity, Lightbulb, ArrowRight } from "lucide-react"
import type React from "react"
import { ReactNode } from "react"
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { ScreenshotFrame } from "./ScreenshotFrame"
import { Card, CardContent, CardHeader } from '~/components/ui/card'

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] group-hover:scale-105 transition-transform duration-700 ease-out">
        <div className="absolute inset-0 [--border:rgba(255,255,255,0.1)] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"/>
        <div className="bg-surface absolute inset-0 m-auto flex size-14 items-center justify-center border-t border-l border-border rounded-lg text-brand-text shadow-lg shadow-black/20">{children}</div>
    </div>
)

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const { t } = useTranslation()
  const stepsData = [
    {
      icon: <Settings className="size-6" />,
      ...t.howItWorks.steps[0],
    },
    {
      icon: <Activity className="size-6" />,
      ...t.howItWorks.steps[1],
    },
    {
      icon: <Lightbulb className="size-6" />,
      ...t.howItWorks.steps[2],
    },
  ]

  return (
    <section
      id="how-it-works"
      className={cn("w-full bg-canvas py-24 border-t border-hairline border-border relative", className)}
      {...props}
    >
      <div className="container mx-auto max-w-6xl px-6 relative z-10">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-medium tracking-tight text-ink-primary sm:text-5xl">
            {t.howItWorks.heading}
          </h2>
          <p className="mt-6 text-lg text-ink-secondary">
            {t.howItWorks.subheading}
          </p>
        </div>

        {/* Bento grid horizontal (Impeccable Variant C) */}
        <div className="mx-auto grid max-w-sm gap-8 *:text-center md:max-w-full md:grid-cols-3">
          {stepsData.map((step, index) => (
            <Card key={index} className="group overflow-hidden border-border bg-surface hover:border-brand/30 hover:bg-elevated transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-brand/5">
                <CardHeader className="pb-2 pt-8">
                    <CardDecorator>
                        {step.icon}
                    </CardDecorator>

                    <h3 className="mt-8 font-semibold text-ink-primary text-xl tracking-tight">{step.title}</h3>
                </CardHeader>

                <CardContent className="pb-8">
                    <p className="text-sm text-ink-secondary leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </CardContent>
            </Card>
          ))}
        </div>

        {/* Showcase de l'écran Opportunités (Texte centré, Dashboard en dessous) */}
        <div className="mx-auto mt-32 max-w-5xl">
          <div className="flex flex-col items-center text-center gap-12">
            <div className="max-w-3xl flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium uppercase tracking-widest mb-6">
                Le Résultat
              </div>
              <h3 className="text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl leading-[1.15]">
                {t.howItWorks.opportunities.heading}
              </h3>
              <p className="mt-5 text-base leading-relaxed text-ink-secondary">
                {t.howItWorks.opportunities.description}
              </p>
              
              <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
                {[
                  "Priorisation par impact business",
                  "Scripts de prompts prêts à l'emploi",
                  "Tracking d'évolution dans le temps"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-ink-secondary">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="mt-10">
                <button className="group inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-text transition-colors">
                  Voir la démo du dashboard 
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
            
            <div className="w-full relative mt-4">
              {/* Glow sous l'image */}
              <div className="absolute inset-0 bg-brand/10 blur-[100px] rounded-full scale-90 -z-10"></div>
              
              <ScreenshotFrame
                label={t.howItWorks.opportunities.previewLabel}
                src="/images/dashboard/opportunities_card.png"
                urlPath="app.reflet.io/dashboard/opportunites"
                glow={false}
                badge={t.howItWorks.opportunities.previewBadge}
                hideCrosses={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
