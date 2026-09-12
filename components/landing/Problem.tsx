const items = [
  { title: 'Invisible', body: "Votre marque n'apparaît pas dans les recommandations pertinentes." },
  { title: 'Mal positionnée', body: "Elle apparaît derrière d'autres solutions." },
  { title: 'Mal comprise', body: "Votre site exprime une offre claire, mais les réponses observées ne la reflètent pas correctement." },
]

export function Problem() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-1200">
        <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-ink-primary">
          Votre site sait ce que vous vendez. ChatGPT, lui, peut en dire autre chose.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-surface p-6">
              <p className="text-sm font-medium text-ink-primary">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-ink-muted">
          Reflet mesure cet écart au lieu de vous demander de le deviner.
        </p>
      </div>
    </section>
  )
}
