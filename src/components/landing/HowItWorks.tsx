import { cn } from "~/lib/utils"
import { Settings, Activity, Lightbulb, ArrowRight } from "lucide-react"
import type React from "react"
import { ReactNode } from "react"
import { useTranslation } from '~/lib/i18n/LanguageContext'
import { OpportunityCardPreview } from "./OpportunityCardPreview"
import { motion } from "framer-motion"

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-24 group-hover:scale-110 transition-transform duration-500 ease-out">
        {/* Cercles de fond avec glow */}
        <div className="absolute inset-0 rounded-full bg-brand/5 border border-brand/20 group-hover:border-brand/40 group-hover:bg-brand/10 transition-colors duration-500" />
        <div className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand shadow-inner shadow-brand/20 group-hover:shadow-brand/40 group-hover:bg-brand group-hover:text-black transition-all duration-500">
            {children}
        </div>
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

        {/* Timeline des 3 étapes */}
        <div className="relative mx-auto max-w-sm md:max-w-5xl">
          {/* Ligne pointillée horizontale (visible uniquement sur desktop) */}
          <div className="hidden md:block absolute top-[48px] left-1/6 right-1/6 h-px border-t-2 border-dashed border-border/60 -z-10" />
          
          <div className="grid gap-12 md:gap-8 md:grid-cols-3">
            {stepsData.map((step, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5, ease: "easeOut" }}
                className="group relative flex flex-col items-center text-center"
              >
                  {/* Filigrane du numéro */}
                  <div className="absolute -top-6 -right-4 text-[120px] font-black leading-none text-ink-primary opacity-[0.03] pointer-events-none select-none transition-opacity duration-500 group-hover:opacity-[0.06]">
                    0{index + 1}
                  </div>

                  <CardDecorator>
                      {step.icon}
                  </CardDecorator>

                  <h3 className="mt-8 font-semibold text-ink-primary text-xl tracking-tight z-10">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm text-ink-secondary leading-relaxed max-w-[280px] z-10">
                    {step.description}
                  </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Showcase de l'écran Opportunités (Texte à gauche, Composant à droite) */}
        <div className="mx-auto mt-32 max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium uppercase tracking-widest mb-6">
                Le Résultat
              </div>
              <h3 className="text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl leading-[1.15]">
                {t.howItWorks.opportunities.heading}
              </h3>
              <p className="mt-5 text-base leading-relaxed text-ink-secondary">
                {t.howItWorks.opportunities.description}
              </p>
              
              <ul className="mt-8 space-y-4">
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
            
            <div className="lg:col-span-7 relative">
              {/* Glow sous l'image */}
              <div className="absolute inset-0 bg-brand/10 blur-[80px] rounded-full scale-75 -z-10"></div>
              
              <OpportunityCardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
