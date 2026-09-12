const steps = [
  'Votre site',
  'Reflet comprend votre marque',
  'Reflet construit vos questions',
  'ChatGPT est interrogé',
  'Les réponses sont analysées',
  'Score + preuves + opportunités',
  'Évolution dans le temps',
]

export function HowItWorks() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-tight text-ink-primary">Comment ça fonctionne</h2>
        <div className="mt-12 flex flex-col items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="rounded-lg border border-border bg-surface px-5 py-3 text-sm text-ink-primary">{step}</div>
              {i < steps.length - 1 && <div className="my-2 h-6 w-px bg-border" />}
            </div>
          ))}
        </div>
        <p className="mt-10 text-base font-medium text-ink-primary">Vous choisissez les questions. Reflet s'occupe du reste.</p>
      </div>
    </section>
  )
}
