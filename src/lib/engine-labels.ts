// Mapping identifiant technique → libellé/couleur grand public pour les moteurs IA
// Utilisé par les composants UI pour afficher des noms compréhensibles au lieu des identifiants bruts

export type EngineId = 'openai' | 'perplexity'

export interface EngineLabel {
  name: string
  color: string
}

const ENGINE_LABELS: Record<EngineId, EngineLabel> = {
  openai: {
    name: 'ChatGPT',
    color: 'rgb(var(--color-brand))',
  },
  perplexity: {
    name: 'Perplexity',
    color: '#3b82f6',
  },
}

const FALLBACK_COLORS = ['rgb(var(--color-brand))', '#8b5cf6', '#3b82f6', '#ec4899', 'rgb(var(--color-success))']

export function getEngineLabel(engine: string): string {
  return ENGINE_LABELS[engine as EngineId]?.name || engine
}

export function getEngineColor(engine: string, index?: number): string {
  return ENGINE_LABELS[engine as EngineId]?.color || (index !== undefined ? FALLBACK_COLORS[index % FALLBACK_COLORS.length] : FALLBACK_COLORS[0])
}

export function isKnownEngine(engine: string): engine is EngineId {
  return engine in ENGINE_LABELS
}
