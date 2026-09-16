import { Bot } from 'lucide-react'

const items = [
  { title: 'Invisible', body: "Votre marque n'apparaît pas dans les recommandations pertinentes." },
  { title: 'Mal positionnée', body: "Elle apparaît derrière d'autres solutions." },
  { title: 'Mal comprise', body: "Votre site exprime une offre claire, mais les réponses observées ne la reflètent pas correctement." },
]

export function Problem() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto grid max-w-1200 items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-ink-primary">
            Votre site sait ce que vous vendez. ChatGPT, lui, peut en dire autre chose.
          </h2>
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-surface p-5">
                <p className="text-sm font-medium text-ink-primary">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Reflet mesure cet écart au lieu de vous demander de le deviner.
          </p>
        </div>

        {/* Mini-mockup : une vraie réponse d'IA où la marque est absente */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated border border-border text-ink-muted">
              <Bot className="size-4" />
            </div>
            <div className="rounded-lg rounded-tl-none bg-elevated px-4 py-3 text-sm leading-relaxed text-ink-secondary">
              « Pour la facturation d'un artisan, je recommande Wave, QuickBooks ou Zoho Invoice — des
              solutions simples et bien documentées. »
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <span className="text-sm text-danger">✕</span>
            <span className="text-sm text-ink-secondary">SIKKA — absente de la réponse</span>
          </div>
        </div>
      </div>
    </section>
  )
}
