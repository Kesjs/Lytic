import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validation stricte de l'URL du site suivi — requise avant de brancher le
// crawler dessus (cf. reste-a-faire.md : le champ n'avait aucune validation
// de format). N'accepte que http(s) avec un nom d'hôte contenant un point,
// pour éviter des valeurs du type "http://a".
export function isValidWebsiteUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (!url.hostname.includes('.')) return false
    return true
  } catch {
    return false
  }
}

export const QUESTION_MAX_LENGTH = 300
