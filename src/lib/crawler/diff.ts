import type { PageHashes } from './hash'

export type DiffField = keyof PageHashes

export interface DiffResult {
  hasChanged: boolean
  changedFields: DiffField[]
}

export function computeDiff(oldHashes: PageHashes | null, newHashes: PageHashes): DiffResult {
  // Si c'est la toute première fois (baseline), oldHashes est null.
  // Ce n'est pas un changement "utilisateur", c'est l'initialisation.
  if (!oldHashes) {
    return { hasChanged: false, changedFields: [] }
  }

  const fields: DiffField[] = [
    'title_hash',
    'meta_hash',
    'headings_hash',
    'body_hash',
    'pricing_hash',
    'cta_hash',
    'links_hash',
    'structure_hash',
  ]

  const changedFields: DiffField[] = []

  for (const field of fields) {
    // Si l'ancien était null, et le nouveau a une valeur, on ne le marque comme changement QUE
    // si c'est vraiment un changement (l'ancien hash existait et a changé).
    // Si TOUS les anciens hashs étaient nuls, c'est que la page vient d'être indexée, 
    // on l'a géré au-dessus (!oldHashes).
    if (oldHashes[field] !== newHashes[field]) {
      changedFields.push(field)
    }
  }

  return {
    hasChanged: changedFields.length > 0,
    changedFields,
  }
}
