const metrics = [
  { title: 'Présence', body: 'Votre marque est-elle mentionnée ?' },
  { title: 'Recommandation', body: 'Est-elle proposée comme solution ?' },
  { title: 'Position', body: 'Où apparaît-elle lorsqu’une liste est générée ?' },
  { title: 'Concurrence', body: 'Qui apparaît à sa place ou plus fréquemment ?' },
]

export function Metrics() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-1200">
        <h2 className="text-3xl font-medium tracking-tight text-ink-primary">Ce que Reflet mesure</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.title} className="rounded-lg border border-border bg-surface p-6">
              <p className="text-sm font-medium text-ink-primary">{m.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
