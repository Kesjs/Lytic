const loop = [
  { title: 'Voir', body: 'Ce que ChatGPT dit réellement.' },
  { title: 'Comprendre', body: 'Pourquoi certaines marques apparaissent davantage.' },
  { title: 'Agir', body: 'Quelles opportunités méritent votre attention.' },
  { title: 'Vérifier', body: 'Ce qui a évolué à la mesure suivante.' },
]

export function ValueLoop() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {loop.map((step) => (
          <div key={step.title} className="bg-canvas p-6">
            <p className="text-sm font-medium text-brand">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
