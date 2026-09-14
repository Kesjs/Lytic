import { isEqual } from 'lodash-es'
import type { ExtractedContent } from './extract'

export type DiffField = keyof ExtractedContent

export interface DiffResult {
  hasChanged: boolean
  changedFields: DiffField[]
}

export function computeDiff(oldContent: ExtractedContent | null, newContent: ExtractedContent): DiffResult {
  if (!oldContent) {
    return { hasChanged: false, changedFields: [] }
  }

  const fields: DiffField[] = [
    'title',
    'meta',
    'headings',
    'body',
    'pricing',
    'cta',
    'links',
    'structure',
  ]

  const changedFields: DiffField[] = []

  for (const field of fields) {
    if (!isEqual(oldContent[field], newContent[field])) {
      changedFields.push(field)
    }
  }

  return {
    hasChanged: changedFields.length > 0,
    changedFields,
  }
}
