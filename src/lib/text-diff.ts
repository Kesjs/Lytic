// Diff mot-à-mot par LCS (programmation dynamique) — utilisé par le timeline
// de l'Historique pour surligner précisément ce qui a changé dans un champ de
// contenu (ex. "Contenu principal"), plutôt que d'afficher deux blocs de
// texte brut où le lecteur doit chercher lui-même la différence.
//
// Complexité O(n·m) sur le nombre de tokens : largement suffisant pour un
// extrait de page (quelques centaines de mots), voir DIFF_MAX_WORDS plus bas
// pour le plafond au-delà duquel l'appelant doit retomber sur un rendu non
// diffé (texte brut tronqué).

export interface DiffToken {
  type: 'equal' | 'add' | 'remove'
  text: string
}

// Au-delà de ce nombre de mots par côté, le coût O(n·m) du LCS devient trop
// élevé pour un rendu synchrone côté client — l'appelant doit alors
// retomber sur l'ancien rendu (texte tronqué, non diffé).
export const DIFF_MAX_WORDS = 400

// Découpe en conservant les séparateurs (espaces, ponctuation attachée aux
// mots) pour que la texte recomposée reste lisible telle quelle.
function splitTokens(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? []
}

export function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length
}

export function diffWords(oldText: string, newText: string): DiffToken[] {
  const a = splitTokens(oldText)
  const b = splitTokens(newText)
  const n = a.length
  const m = b.length

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const tokens: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      tokens.push({ type: 'equal', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ type: 'remove', text: a[i] })
      i++
    } else {
      tokens.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < n) tokens.push({ type: 'remove', text: a[i++] })
  while (j < m) tokens.push({ type: 'add', text: b[j++] })

  return tokens
}

/**
 * Réduit les longues plages inchangées à `contextWords` mots de contexte de
 * chaque côté d'un changement, remplacées sinon par un seul token "…" —
 * pour que l'œil aille droit au changement plutôt que de le chercher dans
 * un pavé de texte identique. Retourne la liste complète si tout tient déjà
 * dans le contexte (rien à collapser).
 */
export function windowTokens(tokens: DiffToken[], contextWords: number): DiffToken[] {
  const isWord = (t: DiffToken) => t.text.trim().length > 0
  const changedIdx: number[] = []
  tokens.forEach((t, i) => {
    if (t.type !== 'equal') changedIdx.push(i)
  })
  if (changedIdx.length === 0) return tokens

  const keep = new Set<number>()
  for (const idx of changedIdx) {
    keep.add(idx)
    let count = 0
    for (let i = idx - 1; i >= 0 && count < contextWords; i--) {
      keep.add(i)
      if (isWord(tokens[i])) count++
    }
    count = 0
    for (let i = idx + 1; i < tokens.length && count < contextWords; i++) {
      keep.add(i)
      if (isWord(tokens[i])) count++
    }
  }

  if (keep.size === tokens.length) return tokens

  const result: DiffToken[] = []
  let i = 0
  while (i < tokens.length) {
    if (keep.has(i)) {
      result.push(tokens[i])
      i++
    } else {
      let j = i
      while (j < tokens.length && !keep.has(j)) j++
      result.push({ type: 'equal', text: ' … ' })
      i = j
    }
  }
  return result
}
