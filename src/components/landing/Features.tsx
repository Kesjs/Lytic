import { Cpu, Fingerprint, Pencil, Settings2, Sparkles, Zap } from 'lucide-react'

export function Features() {
    return (
        <section id="features" className="py-12 md:py-20 bg-canvas">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl text-ink-primary">
                        The foundation for creative teams management
                    </h2>
                    <p className="text-ink-secondary">
                        Lyra is evolving to be more than just the models. It supports an entire to the APIs and platforms helping developers and businesses innovate.
                    </p>
                </div>

                <div className="relative mx-auto grid max-w-2xl lg:max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
                    {[
                        {
                            icon: Zap,
                            title: "Faaast",
                            desc: "It supports an entire helping developers and innovate."
                        },
                        {
                            icon: Cpu,
                            title: "Powerful",
                            desc: "It supports an entire helping developers and businesses."
                        },
                        {
                            icon: Fingerprint,
                            title: "Security",
                            desc: "It supports an helping developers businesses."
                        },
                        {
                            icon: Pencil,
                            title: "Customization",
                            desc: "It supports helping developers and businesses innovate."
                        },
                        {
                            icon: Settings2,
                            title: "Control",
                            desc: "It supports helping developers and businesses innovate."
                        },
                        {
                            icon: Sparkles,
                            title: "Built for AI",
                            desc: "It supports helping developers and businesses innovate."
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
