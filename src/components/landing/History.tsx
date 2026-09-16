const events = [
  { date: '08 sept.', label: 'Mesure #11 — Score 64' },
  { date: '10 sept.', label: 'Modification détectée — /pricing' },
  { date: '12 sept.', label: 'Modification détectée — /' },
  { date: '15 sept.', label: 'Mesure #12 — Score 68' },
]

// Sparkline dérivée des deux mesures réelles ci-dessus (64 → 68), pas de donnée inventée en plus.
function ScoreSparkline() {
  return (
    <svg viewBox="0 0 200 56" className="h-14 w-full" aria-hidden="true">
      <polyline
        points="4,40 68,42 132,36 196,12"
        fill="none"
        stroke="rgb(var(--color-brand))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="40" r="3" fill="rgb(var(--color-brand))" />
      <circle cx="196" cy="12" r="3" fill="rgb(var(--color-brand))" />
      <text x="0" y="54" className="fill-ink-muted text-[10px]">64</text>
      <text x="184" y="26" className="fill-ink-muted text-[10px]">68</text>
    </svg>
  )
}

export function History() {
  return (
    <section id="historique" className="border-t border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-ink-primary">
            Votre visibilité n'est pas un chiffre isolé.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-secondary">
            Reflet surveille automatiquement votre site. Vous n'avez pas besoin de déclarer chaque modification.
          </p>
          <div className="mt-6 max-w-xs rounded-lg border border-border bg-surface p-4">
            <ScoreSparkline />
          </div>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
          {events.map((e) => (
            <div key={e.label} className="flex items-baseline gap-4 text-sm">
              <span className="w-16 shrink-0 text-ink-muted">{e.date}</span>
              <span className="text-ink-secondary">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
