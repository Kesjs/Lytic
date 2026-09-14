import { describe, it, expect } from 'vitest'
import { isValidWebsiteUrl, QUESTION_MAX_LENGTH } from '~/lib/utils'

describe('isValidWebsiteUrl', () => {
  // ── Cas valides ────────────────────────────────────────────────────────────
  it('accepte une URL https valide', () => {
    expect(isValidWebsiteUrl('https://acme.com')).toBe(true)
  })

  it('accepte une URL http valide', () => {
    expect(isValidWebsiteUrl('http://acme.com')).toBe(true)
  })

  it('accepte une URL avec sous-domaine', () => {
    expect(isValidWebsiteUrl('https://www.acme.com/about')).toBe(true)
  })

  // ── Schémas dangereux ──────────────────────────────────────────────────────
  it('rejette javascript:', () => {
    expect(isValidWebsiteUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejette data:', () => {
    expect(isValidWebsiteUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejette vbscript:', () => {
    expect(isValidWebsiteUrl('vbscript:MsgBox(1)')).toBe(false)
  })

  it('rejette file:', () => {
    expect(isValidWebsiteUrl('file:///etc/passwd')).toBe(false)
  })

  // ── Protocoles non-HTTP ───────────────────────────────────────────────────
  it('rejette une URL sans protocole', () => {
    expect(isValidWebsiteUrl('acme.com')).toBe(false)
  })

  it('rejette ftp:', () => {
    expect(isValidWebsiteUrl('ftp://acme.com')).toBe(false)
  })

  // ── IPs privées / réservées (SSRF) ────────────────────────────────────────
  it('rejette 169.254.169.254 (IMDS AWS)', () => {
    expect(isValidWebsiteUrl('http://169.254.169.254/')).toBe(false)
    expect(isValidWebsiteUrl('http://169.254.169.254/latest/meta-data/')).toBe(false)
  })

  it('rejette 192.168.x.x (réseau privé)', () => {
    expect(isValidWebsiteUrl('http://192.168.1.1')).toBe(false)
  })

  it('rejette 10.x.x.x (réseau privé)', () => {
    expect(isValidWebsiteUrl('http://10.0.0.1')).toBe(false)
  })

  it('rejette 172.16.x.x – 172.31.x.x (réseau privé)', () => {
    expect(isValidWebsiteUrl('http://172.16.0.1')).toBe(false)
    expect(isValidWebsiteUrl('http://172.31.255.255')).toBe(false)
    // Hors plage : 172.32.x.x doit être accepté
    expect(isValidWebsiteUrl('http://172.32.0.1')).toBe(true)
  })

  it('rejette 127.0.0.1 (loopback)', () => {
    expect(isValidWebsiteUrl('http://127.0.0.1')).toBe(false)
  })

  it('rejette localhost', () => {
    expect(isValidWebsiteUrl('http://localhost')).toBe(false)
    expect(isValidWebsiteUrl('http://localhost:8080')).toBe(false)
  })

  // ── Valeur vide ───────────────────────────────────────────────────────────
  it('rejette une chaîne vide', () => {
    expect(isValidWebsiteUrl('')).toBe(false)
  })

  it('rejette une chaîne avec seulement des espaces', () => {
    expect(isValidWebsiteUrl('   ')).toBe(false)
  })
})

describe('QUESTION_MAX_LENGTH', () => {
  it('est bien 300', () => {
    expect(QUESTION_MAX_LENGTH).toBe(300)
  })

  it('une question à exactement 300 caractères est dans la limite', () => {
    const question = 'a'.repeat(QUESTION_MAX_LENGTH)
    expect(question.length <= QUESTION_MAX_LENGTH).toBe(true)
  })

  it('une question à 301 caractères dépasse la limite', () => {
    const question = 'a'.repeat(QUESTION_MAX_LENGTH + 1)
    expect(question.length > QUESTION_MAX_LENGTH).toBe(true)
  })
})
