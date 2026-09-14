import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Validation d'URL ────────────────────────────────────────────────────────
//
// Protection côté format (client + server).
// La protection SSRF complète (résolution DNS + plages IP) est dans
// src/lib/crawler/fetch-safe.ts — utilisée à chaque fetch réel côté serveur.
//
// Cette fonction rejette :
//   - Les schémas dangereux : javascript:, data:, vbscript:
//   - Les protocoles non HTTP(s)
//   - Les hostnames sans point (type "http://a")
//   - Les IPs littérales privées (best-effort côté client, sans DNS lookup)
//     → la protection complète se fait via fetchSafe() côté serveur.

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:']

/**
 * Plages d'IPs privées / réservées — vérifiées en mode "best-effort" côté
 * client (IPs écrites en dur dans l'URL). La protection DNS complète est
 * dans fetch-safe.ts.
 */
function isLiteralPrivateIp(hostname: string): boolean {
  // localhost
  if (hostname === 'localhost') return true

  // IPv6 loopback et ULA
  if (hostname === '::1' || hostname === '[::1]') return true
  if (/^\[?fc[0-9a-f]{2}:/i.test(hostname)) return true
  if (/^\[?fe80:/i.test(hostname)) return true

  // Doit être une IPv4 littérale
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return false

  const [, a, b] = ipv4.map(Number)

  // 10.x.x.x
  if (a === 10) return true
  // 172.16.x.x – 172.31.x.x
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.x.x
  if (a === 192 && b === 168) return true
  // 127.x.x.x (loopback)
  if (a === 127) return true
  // 169.254.x.x (link-local / IMDS AWS, GCP, Azure)
  if (a === 169 && b === 254) return true
  // 0.x.x.x
  if (a === 0) return true
  // 100.64.x.x – 100.127.x.x (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true

  return false
}

export function isValidWebsiteUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  // Rejeter les schémas dangereux avant même de parser l'URL
  const lower = trimmed.toLowerCase()
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) return false
  }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    // Hostname doit contenir un point (évite "http://a")
    if (!url.hostname.includes('.') && !url.hostname.includes(':')) {
      // Exception : IPs seules sont aussi à bloquer
      if (!url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) return false
    }

    // Bloquer les IPs privées/réservées écrites en dur dans l'URL
    if (isLiteralPrivateIp(url.hostname)) return false

    return true
  } catch {
    return false
  }
}

export const QUESTION_MAX_LENGTH = 300
