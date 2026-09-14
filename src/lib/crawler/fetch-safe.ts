import { lookup } from 'node:dns/promises'
import { Buffer } from 'node:buffer'

// ─── Plages IP privées / réservées (SSRF protection) ─────────────────────────
//
// Toute URL dont le hostname se résout vers l'une de ces plages est rejetée.
// On re-check aussi après chaque redirection (redirect: 'manual').
//
// Plages bloquées :
//   10.0.0.0/8        — RFC 1918 (réseau privé classe A)
//   172.16.0.0/12     — RFC 1918 (réseau privé classe B)
//   192.168.0.0/16    — RFC 1918 (réseau privé classe C)
//   127.0.0.0/8       — Loopback IPv4
//   169.254.0.0/16    — Link-local (AWS IMDS, Azure, GCP metadata)
//   0.0.0.0/8         — This-network
//   100.64.0.0/10     — Shared Address Space (CGNAT)
//   ::1               — Loopback IPv6
//   fc00::/7          — Unique Local Address IPv6
//   fe80::/10         — Link-local IPv6

const MAX_RESPONSE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_REDIRECTS = 5

/**
 * Convertit une adresse IPv4 en entier 32 bits non signé.
 */
function ipv4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0
}

/**
 * Vérifie si une adresse IP (v4 ou v6) appartient à une plage privée/réservée.
 * Retourne true si l'IP est DANGEREUSE (= à bloquer).
 */
export function isPrivateIp(ip: string): boolean {
  // IPv6 loopback & ULA
  if (ip === '::1') return true
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true
  if (ip.toLowerCase().startsWith('fe80')) return true
  // IPv4-mapped IPv6 : ::ffff:192.168.x.x
  const ipv4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (ipv4Mapped) return isPrivateIp(ipv4Mapped[1])

  // Doit être IPv4 à partir d'ici
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false

  const n = ipv4ToInt(ip)

  const ranges: [number, number][] = [
    [ipv4ToInt('10.0.0.0'),     ipv4ToInt('10.255.255.255')],     // RFC 1918 classe A
    [ipv4ToInt('172.16.0.0'),   ipv4ToInt('172.31.255.255')],     // RFC 1918 classe B
    [ipv4ToInt('192.168.0.0'),  ipv4ToInt('192.168.255.255')],    // RFC 1918 classe C
    [ipv4ToInt('127.0.0.0'),    ipv4ToInt('127.255.255.255')],    // Loopback
    [ipv4ToInt('169.254.0.0'),  ipv4ToInt('169.254.255.255')],    // Link-local (IMDS)
    [ipv4ToInt('0.0.0.0'),      ipv4ToInt('0.255.255.255')],      // This-network
    [ipv4ToInt('100.64.0.0'),   ipv4ToInt('100.127.255.255')],    // CGNAT
    [ipv4ToInt('192.0.0.0'),    ipv4ToInt('192.0.0.255')],        // IETF Protocol Assignments
    [ipv4ToInt('192.0.2.0'),    ipv4ToInt('192.0.2.255')],        // TEST-NET-1
    [ipv4ToInt('198.51.100.0'), ipv4ToInt('198.51.100.255')],     // TEST-NET-2
    [ipv4ToInt('203.0.113.0'),  ipv4ToInt('203.0.113.255')],      // TEST-NET-3
    [ipv4ToInt('240.0.0.0'),    ipv4ToInt('255.255.255.255')],    // Réservé
  ]

  return ranges.some(([lo, hi]) => n >= lo && n <= hi)
}

/**
 * Résout un hostname en IP et vérifie qu'il n'est pas privé.
 * Lève une Error si le hostname se résout vers une IP privée/réservée.
 */
async function assertNotPrivateHost(hostname: string): Promise<void> {
  // Bloque localhost directement (pas de DNS lookup nécessaire)
  if (hostname === 'localhost') {
    throw new Error(`[SSRF] Hostname bloqué : ${hostname}`)
  }

  let addresses: string[]
  try {
    const result = await lookup(hostname, { all: true })
    addresses = result.map((r) => r.address)
  } catch {
    // Hostname non résolvable → on laisse le fetch échouer normalement
    return
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error(`[SSRF] IP privée bloquée : ${hostname} → ${addr}`)
    }
  }
}

export interface FetchSafeOptions {
  /** Headers additionnels */
  headers?: Record<string, string>
  /** Timeout en ms (défaut : 10 000) */
  timeoutMs?: number
  /** Taille max de la réponse en bytes (défaut : 5 Mo) */
  maxResponseBytes?: number
}

export interface FetchSafeResult {
  url: string
  status: number
  text: string
}

/**
 * fetch() sécurisé contre les attaques SSRF.
 *
 * Protections :
 *   1. Résolution DNS + rejet des IPs privées/réservées.
 *   2. Gestion manuelle des redirections (redirect: 'manual') avec re-validation
 *      de chaque URL de redirection.
 *   3. Limite de taille de réponse (défaut 5 Mo) pour éviter le DoS.
 *   4. Timeout configurable.
 *
 * Usage : remplace tous les `fetch()` bruts dans le crawler.
 */
export async function fetchSafe(
  url: string,
  options: FetchSafeOptions = {},
): Promise<FetchSafeResult> {
  const {
    headers = {},
    timeoutMs = 10_000,
    maxResponseBytes = MAX_RESPONSE_SIZE_BYTES,
  } = options

  let currentUrl = url
  let redirectCount = 0

  while (redirectCount <= MAX_REDIRECTS) {
    const parsed = new URL(currentUrl)

    // Rejeter les schémas non-HTTP
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`[SSRF] Schéma non autorisé : ${parsed.protocol}`)
    }

    // Vérification DNS avant chaque fetch (y compris après redirection)
    await assertNotPrivateHost(parsed.hostname)

    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'RefletBot/1.0 (+https://reflet.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        ...headers,
      },
      redirect: 'manual', // Pas de suivi automatique des redirections
      signal: AbortSignal.timeout(timeoutMs),
    })

    // Gestion manuelle des redirections
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error(`[SSRF] Redirection sans Location header`)
      // Résoudre l'URL relative par rapport à l'URL courante
      currentUrl = new URL(location, currentUrl).toString()
      redirectCount++
      continue
    }

    // Lecture avec limite de taille
    const reader = response.body?.getReader()
    if (!reader) {
      return { url: currentUrl, status: response.status, text: '' }
    }

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        totalBytes += value.byteLength
        if (totalBytes > maxResponseBytes) {
          reader.cancel()
          throw new Error(`[SSRF] Réponse trop grande (> ${maxResponseBytes} bytes) : ${currentUrl}`)
        }
        chunks.push(value)
      }
    }

    const text = new TextDecoder().decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c))),
    )

    return { url: currentUrl, status: response.status, text }
  }

  throw new Error(`[SSRF] Trop de redirections (>${MAX_REDIRECTS}) : ${url}`)
}
