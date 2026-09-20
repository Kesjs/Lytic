import { Zap, Users, Target, Settings2, Search, History } from 'lucide-react'

export function Features() {
    return (
        <section id="features" className="py-12 md:py-20 bg-canvas">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl text-ink-primary">
                        Ce qui distingue Reflet
                    </h2>
                    <p className="text-ink-secondary">
                        Pas un outil SEO de plus à apprendre — une couche de suivi simple, pensée pour les équipes qui n'ont pas le temps de gérer un outil complexe.
                    </p>
                </div>

                <div className="relative mx-auto grid max-w-2xl lg:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
                    {[
                        {
                            icon: Zap,
                            title: "Simplicité",
                            desc: "URL, questions, résultat — aucune configuration technique à mettre en place."
                        },
                        {
                            icon: Users,
                            title: "Pensé pour les PME",
                            desc: "Pas besoin d'une équipe SEO dédiée pour suivre sa visibilité dans les réponses IA."
                        },
                        {
                            icon: Target,
                            title: "Profondeur plutôt que dispersion",
                            desc: "Une mesure rigoureuse sur le moteur IA le plus utilisé, plutôt qu'une couverture superficielle de plusieurs."
                        },
                        {
                            icon: Settings2,
                            title: "Automatisation",
                            desc: "Les questions suivies sont générées et mesurées automatiquement, sans prompts à écrire à la main."
                        },
                        {
                            icon: Search,
                            title: "Concurrents détectés",
                            desc: "Reflet identifie automatiquement les marques citées à votre place, sans saisie manuelle."
                        },
                        {
                            icon: History,
                            title: "Historique",
                            desc: "Une mémoire de votre visibilité qui se construit mesure après mesure, semaine après semaine."
                        }
                    ].map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div key={i} className="space-y-3 p-8 lg:p-12 border-r border-b border-border bg-surface/50 hover:bg-elevated transition-colors">
                                <div className="flex items-center gap-2 text-ink-primary">
                                    <Icon className="size-4" />
                                    <h3 className="text-sm font-medium">{feature.title}</h3>
                                </div>
                                <p className="text-sm text-ink-secondary">{feature.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
