import { isEqual } from 'lodash-es'
import type { ExtractedContent, ContentSection } from './extract'

export type DiffField =
  | 'title'
  | 'meta'
  | 'headings'
  | 'sections'
  | 'mainContent'
  | 'pricing'
  | 'cta'
  | 'links'
  | 'structure'

export type ChangeImportance = 'watch' | 'low'

export interface DiffResult {
  hasChanged: boolean
  changedFields: DiffField[]
  /** Niveau d'importance du changement détecté (audit détection §3.A) :
   *  - 'watch' : au moins un champ pertinent a changé de façon significative
   *              → doit déclencher notification + remesure automatique Pro.
   *  - 'low'   : seuls des champs de bruit ont changé, ou le delta d'un champ
   *              conditionnel reste sous le seuil de similarité → enregistré
   *              pour historique/debug, mais ne déclenche rien. */
  importance: ChangeImportance
}

const ALL_FIELDS: DiffField[] = [
  'title',
  'meta',
  'headings',
  'sections',
  'mainContent',
  'pricing',
  'cta',
  'links',
  'structure',
]

// Déclenchement immédiat dès qu'ils changent : le contenu qui compte le plus
// pour la visibilité IA (prix, titre, meta) et le plus rarement affecté par
// du contenu dynamique sans rapport (pub, recommandations, A/B test).
const IMMEDIATE_FIELDS: DiffField[] = ['title', 'pricing', 'meta']

// Déclenchement conditionnel : ne comptent comme changement significatif que
// si le delta dépasse le seuil de similarité ci-dessous — sinon traités comme
// du bruit (reformulation mineure, paragraphe reformulé, etc.).
// NB (A2.5) : `body` (texte brut aplati de toute la page) n'est plus comparé
// ici — il produisait des diffs illisibles mélangeant nav/header/footer et
// contenu éditorial. On compare désormais `sections` (contenu structuré par
// heading), qui reflète le vrai contenu éditorial de la page. `body` reste
// disponible dans ExtractedContent pour debug uniquement.
// `mainContent` (texte aplati mais limité à <main>/<article>, sans nav/footer)
// ne sert que de filet de sécurité pour les pages sans heading détectable
// (donc sections = []) — voir le garde-fou dans computeDiff ci-dessous, pour
// ne pas dupliquer/bruiter le diff des pages qui ont déjà des sections.
const CONDITIONAL_FIELDS: DiffField[] = ['sections', 'headings', 'mainContent']

// Purement informatif : toujours listés dans `changedFields` pour contexte/
// debug, mais ne font jamais basculer `importance` à 'watch' à eux seuls.
// `structure` en particulier est le champ le plus fragile : n'importe quel
// contenu dynamique (pub, recommandations, A/B test) peut le faire varier.
const INFORMATIVE_FIELDS: DiffField[] = ['links', 'cta', 'structure']

// En dessous de ce ratio de similarité de Jaccard (mots communs / mots
// distincts), un champ de CONDITIONAL_FIELDS est considéré comme ayant
// significativement changé. Au-dessus, la différence est traitée comme du
// bruit (réordonnancement, contenu injecté ailleurs sur la page, etc.).
const SIMILARITY_THRESHOLD = 0.85

function isSections(value: unknown): value is ContentSection[] {
  return Array.isArray(value) && (value.length === 0 || typeof (value[0] as any)?.heading === 'string')
}

function toComparableText(value: string | string[] | ContentSection[] | null): string {
  if (value === null) return ''
  if (isSections(value)) {
    return value.map((s) => `${s.heading} ${s.content}`).join(' ')
  }
  return Array.isArray(value) ? value.join(' ') : value
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

/** Similarité de Jaccard sur les mots (0 = totalement différent, 1 = identique).
 *  Pas de dépendance externe : suffisant pour départager "bruit" vs
 *  "changement réel" à un coût nul et instantané (cf. audit détection §6 —
 *  pas d'appel IA pour cette décision). */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))

  if (setA.size === 0 && setB.size === 0) return 1

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 1 : intersection / union
}

export function computeDiff(
  oldContent: ExtractedContent | null,
  newContent: ExtractedContent,
): DiffResult {
  if (!oldContent) {
    return { hasChanged: false, changedFields: [], importance: 'low' }
  }

  const changedFields: DiffField[] = []
  let hasSignificantChange = false

  // Pages avec sections structurées détectées : `mainContent` ferait double
  // emploi avec `sections` (même contenu, mais aplati et donc de nouveau
  // illisible en diff) — on ne le compare que comme filet de sécurité pour
  // les pages sans heading détectable dans <main>/<article>.
  const hasSections = oldContent.sections.length > 0 || newContent.sections.length > 0

  for (const field of ALL_FIELDS) {
    if (field === 'mainContent' && hasSections) continue

    const oldValue = oldContent[field]
    const newValue = newContent[field]
    if (isEqual(oldValue, newValue)) continue

    changedFields.push(field)

    if (IMMEDIATE_FIELDS.includes(field)) {
      hasSignificantChange = true
    } else if (CONDITIONAL_FIELDS.includes(field)) {
      const similarity = jaccardSimilarity(toComparableText(oldValue), toComparableText(newValue))
      if (similarity < SIMILARITY_THRESHOLD) hasSignificantChange = true
    }
    // INFORMATIVE_FIELDS : jamais 'watch' à eux seuls (bruit) — voir plus haut.
  }

  return {
    hasChanged: changedFields.length > 0,
    changedFields,
    importance: hasSignificantChange ? 'watch' : 'low',
  }
}
