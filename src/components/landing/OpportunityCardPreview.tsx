// Reproduction fidèle de la carte Opportunité dépliée (voir
// src/routes/dashboard/opportunites.tsx), avec le contenu RGPD figé en dur
// pour la landing — mêmes classes Tailwind que le vrai composant, aucune
// donnée fetchée. Volontairement sans chrome de fenêtre (pas de pastilles,
// pas de barre d'URL) : c'est la carte elle-même qui est mise en avant.

export function OpportunityCardPreview() {
    return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden text-left">
            <div className="p-6 sm:p-7 space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-base font-semibold text-ink-primary">
                            Renforcer les mentions sur la conformité RGPD
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-sm border px-1.5 py-0.5 text-[11px] font-medium bg-warning/10 text-warning border-warning/30">
                                Priorité moyenne
                            </span>
                            <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                                Confiance 72%
                            </span>
                            <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                                2 observations
                            </span>
                            <span className="rounded-sm border border-border bg-elevated px-1.5 py-0.5 text-[11px] text-ink-muted">
                                Ouverte
                            </span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <div className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-muted">
                            ✓
                        </div>
                        <div className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-muted">
                            ✕
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                        Pourquoi (Diagnostic)
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                        Les IA doutent des capacités "Entreprise" et "RGPD" de Nooma.
                    </p>
                </div>

                <div>
                    <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-2">
                        Action recommandée
                    </p>
                    <div className="grid gap-px rounded-md border border-border overflow-hidden bg-border sm:grid-cols-2">
                        <div className="bg-surface p-4">
                            <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-danger/80">
                                <span className="size-1.5 rounded-full bg-danger/80" /> Contenu actuel
                            </span>
                            <p className="text-xs leading-relaxed text-ink-secondary">
                                Aucune section dédiée à l'hébergement des données ou à la conformité RGPD sur le site.
                            </p>
                        </div>
                        <div className="bg-surface p-4">
                            <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-success/80">
                                <span className="size-1.5 rounded-full bg-success/80" /> Cible (Direction)
                            </span>
                            <p className="text-xs leading-relaxed text-ink-secondary">
                                Ajouter une section dédiée hébergement européen et conformité RGPD sur la page d'accueil.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                        Preuves détaillées
                    </p>
                    <ol className="space-y-4">
                        {[
                            { label: "Question", kicker: "Question suivie", content: "Nooma est-il conforme au RGPD ?" },
                            {
                                label: "Réponse observée",
                                kicker: "Réponse observée",
                                content:
                                    "Les modèles ne trouvent pas d'information vérifiable sur la conformité RGPD de Nooma et recommandent de vérifier directement sur le site.",
                            },
                        ].map((step, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[10px] text-ink-secondary">
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                                        {step.label}
                                    </p>
                                    <p className="mt-0.5 text-xs font-medium text-ink-primary">{step.kicker}</p>
                                    <p className="mt-1 text-xs text-ink-secondary bg-elevated/50 p-2.5 rounded border border-border/40">
                                        {step.content}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    )
}