import { getRequestHeader } from '@tanstack/react-start/server'

/**
 * Récupère l'IP du client via le header x-forwarded-for transmis par le proxy (Render).
 * Isolé dans un fichier .server.ts pour respecter les règles de séparation client/serveur de TanStack Start.
 */
export function getClientIp(): string {
  const forwardedFor = getRequestHeader('x-forwarded-for') as string | undefined
  const ipValue = forwardedFor ?? ''
  return ipValue.split(',')[0]?.trim() || 'unknown'
}
