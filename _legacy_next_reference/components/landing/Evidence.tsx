const chain = ['Question', 'Réponse observée', 'Observation', 'Site / preuves', 'Constat', 'Opportunité']

export function Evidence() {
  return (
    <section id="preuves" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-tight text-ink-primary">Pas de score sans preuves.</h2>
        <div className="mt-12 flex flex-col items-center gap-1">
          {chain.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="rounded-md border border-border px-4 py-2 text-sm text-ink-secondary">{step}</div>
              {i < chain.length - 1 && <div className="my-1 h-4 w-px bg-border" />}
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm leading-relaxed text-ink-secondary">
          Chaque insight important peut être remonté à la réponse observée, au contenu du site et aux éléments qui ont conduit à la conclusion.
        </p>
      </div>
    </section>
  )
}
