import { useTranslation } from '~/lib/i18n/LanguageContext'
import { Check, X, User } from 'lucide-react'

function TerminalIllustration() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#0a0a0a] border border-border shadow-2xl shadow-black/50 font-mono text-xs">
      {/* Fenêtre header */}
      <div className="flex items-center px-4 py-3 border-b border-white/5 bg-[#141414]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-danger transition-colors cursor-default"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-warning transition-colors cursor-default"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/10 hover:bg-success transition-colors cursor-default"></div>
        </div>
        <div className="mx-auto text-[10px] text-ink-muted uppercase tracking-widest font-semibold">agent_log.sh</div>
      </div>
      
      {/* Contenu du terminal */}
      <div className="p-6 space-y-4 text-ink-secondary leading-relaxed">
        <div className="flex items-start gap-3">
          <span className="text-brand mt-0.5">➜</span>
          <span className="text-ink-primary font-medium">query: "meilleur outil de support client pour une startup B2B"</span>
        </div>
        
        <div className="space-y-1 pl-6">
          <div className="text-ink-muted opacity-60">[LLM] Searching knowledge base...</div>
          <div className="text-ink-muted opacity-60">[LLM] Synthesizing context & scoring...</div>
        </div>
        
        <div className="pl-6">
          <span className="text-success font-medium">✔</span> Top recommendations retrieved:
        </div>
        
        <div className="pl-12 border-l border-white/5 space-y-3 mt-2">
          <div className="flex items-center justify-between group">
            <span className="text-ink-primary group-hover:text-white transition-colors">1. Zendesk</span>
            <span className="text-ink-muted font-mono text-[10px]">confidence: 0.94</span>
          </div>
          <div className="flex items-center justify-between group">
            <span className="text-ink-primary group-hover:text-white transition-colors">2. Intercom</span>
            <span className="text-ink-muted font-mono text-[10px]">confidence: 0.87</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-danger/10">
            <span className="text-danger flex items-center gap-2">
              3. [Nooma]
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded font-mono">
              ERR: Entity not found
            </span>
          </div>
        </div>
        
        <div className="pt-2 flex items-center gap-2 text-ink-muted pl-6">
          <span className="inline-block w-2 h-4 bg-brand/50 animate-pulse"></span>
          Awaiting next instruction...
        </div>
      </div>
    </div>
  )
}

function ChatIllustration({ good, bad }: { good: string, bad: string }) {
  return (
    <div className="flex flex-col gap-8 relative z-10">
      {/* Ligne de connexion pointillée pour lier les deux concepts */}
      <div className="absolute left-[38px] top-12 bottom-12 w-px border-l-2 border-dashed border-border/40 -z-10"></div>

      {/* Bad Question (Ce qu'ils font) */}
      <div className="group relative rounded-3xl border border-border/60 bg-surface/40 p-6 backdrop-blur-xl transition-all duration-500 hover:bg-surface/80 hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1">
        <div className="flex gap-5">
          <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0 ring-8 ring-canvas transition-transform duration-500 group-hover:scale-110 group-hover:bg-danger/20">
             <X className="size-6 text-danger" strokeWidth={2.5} />
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-danger uppercase tracking-[0.2em]">Prompt Ego-centré</p>
            </div>
            
            {/* Chat Bubble */}
            <div className="relative bg-elevated px-5 py-4 rounded-2xl rounded-tl-sm border border-border/50 text-sm text-ink-primary mb-4 shadow-sm transition-colors duration-300 group-hover:border-border">
              <span className="absolute -left-2 top-0 text-elevated">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H8V12C8 12 8 0 0 0Z" /></svg>
              </span>
              <div className="flex items-start gap-2">
                <User className="size-4 text-ink-muted shrink-0 mt-0.5" />
                <span>{bad}</span>
              </div>
            </div>
            
            <p className="text-[13px] leading-relaxed text-ink-muted">
              L'IA récitera bêtement le contenu de votre site web sans prouver qu'elle vous recommandera à un vrai prospect.
            </p>
          </div>
        </div>
      </div>

      {/* Good Question (Ce qu'il faut faire) */}
      <div className="group relative rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/10 via-surface/40 to-transparent p-6 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(201,171,30,0.15)] hover:-translate-y-1">
        {/* Glow interne au hover */}
        <div className="absolute inset-0 rounded-3xl bg-brand/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
        
        <div className="relative flex gap-5">
          <div className="w-14 h-14 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center shrink-0 text-brand ring-8 ring-canvas shadow-[0_0_20px_rgba(201,171,30,0.3)] transition-all duration-500 group-hover:scale-110 group-hover:bg-brand group-hover:text-black group-hover:shadow-[0_0_30px_rgba(201,171,30,0.5)]">
             <Check className="size-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em]">Prompt Diagnostique</p>
            </div>
            
            {/* Chat Bubble (Premium) */}
            <div className="relative bg-brand px-5 py-4 rounded-2xl rounded-tl-sm text-sm text-black mb-4 shadow-lg shadow-brand/20 font-medium transition-transform duration-300">
              <span className="absolute -left-2 top-0 text-brand">
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H8V12C8 12 8 0 0 0Z" /></svg>
              </span>
              <div className="flex items-start gap-2">
                <User className="size-4 text-black/60 shrink-0 mt-0.5" />
                <span>{good}</span>
              </div>
            </div>
            
            <p className="text-[13px] leading-relaxed text-ink-secondary">
              Simule la vraie requête de votre cible. Vous découvrirez si l'IA vous positionne naturellement comme la solution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Problem() {
  const { t } = useTranslation()

  return (
    <section id="problem" className="border-t border-hairline border-border px-6 py-24 bg-canvas relative overflow-hidden">
      {/* Background glow subtil */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="mx-auto max-w-1200 relative z-10">
        
        {/* TOP PART : Le Terminal (Variante A) */}
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="max-w-lg text-3xl font-medium leading-[1.15] tracking-tight text-ink-primary sm:text-5xl">
              {t.problem.heading}
            </h2>
            <div className="mt-10 space-y-6">
              {t.problem.items.map((item, index) => (
                <div key={item.title} className="group relative pl-6">
                  {/* Ligne verticale indicatrice */}
                  <div className="absolute left-0 top-1.5 bottom-0 w-0.5 bg-border group-hover:bg-brand/50 transition-colors"></div>
                  
                  <p className="text-base font-semibold text-ink-primary">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm font-medium text-ink-muted">
              {t.problem.footer}
            </p>
          </div>

          <div className="relative flex items-center justify-center p-4 lg:p-8">
            <TerminalIllustration />
          </div>
        </div>

        {/* BOTTOM PART : Interface de Chat (Variante B) */}
        <div className="mt-20 grid items-center gap-16 lg:grid-cols-2">
          <div className="lg:order-2">
            <h3 className="text-3xl font-medium tracking-tight text-ink-primary leading-[1.15]">
              {t.problem.question.heading}
            </h3>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary">
              {t.problem.question.description}
            </p>
          </div>
          
          <div className="lg:order-1 relative">
            <ChatIllustration 
              good={t.problem.question.goodExample} 
              bad={t.problem.question.badExample} 
            />
          </div>
        </div>

      </div>
    </section>
  )
}
