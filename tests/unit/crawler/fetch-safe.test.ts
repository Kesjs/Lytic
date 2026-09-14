import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isPrivateIp } from '~/lib/crawler/fetch-safe'

// Note : fetchSafe() elle-même est testée avec des mocks DNS
// car dns.promises.lookup() est une dépendance I/O réelle.

describe('isPrivateIp', () => {
  // ── IPs PRIVÉES (doit retourner true) ────────────────────────────────────
  describe('plages à bloquer', () => {
    it('bloque 10.0.0.0/8 (RFC 1918 classe A)', () => {
      expect(isPrivateIp('10.0.0.0')).toBe(true)
      expect(isPrivateIp('10.255.255.255')).toBe(true)
      expect(isPrivateIp('10.100.50.1')).toBe(true)
    })

    it('bloque 172.16.0.0/12 (RFC 1918 classe B)', () => {
      expect(isPrivateIp('172.16.0.0')).toBe(true)
      expect(isPrivateIp('172.31.255.255')).toBe(true)
      expect(isPrivateIp('172.20.1.1')).toBe(true)
    })

    it('bloque 192.168.0.0/16 (RFC 1918 classe C)', () => {
      expect(isPrivateIp('192.168.0.1')).toBe(true)
      expect(isPrivateIp('192.168.255.255')).toBe(true)
    })

    it('bloque 127.0.0.0/8 (loopback IPv4)', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true)
      expect(isPrivateIp('127.255.255.255')).toBe(true)
    })

    it('bloque 169.254.0.0/16 (link-local / IMDS)', () => {
      expect(isPrivateIp('169.254.0.0')).toBe(true)
      expect(isPrivateIp('169.254.169.254')).toBe(true) // AWS IMDS
      expect(isPrivateIp('169.254.255.255')).toBe(true)
    })

    it('bloque ::1 (loopback IPv6)', () => {
      expect(isPrivateIp('::1')).toBe(true)
    })

    it('bloque les adresses ULA IPv6 (fc00::/7)', () => {
      expect(isPrivateIp('fc00::1')).toBe(true)
      expect(isPrivateIp('fd12:3456:789a::1')).toBe(true)
    })

    it('bloque les adresses link-local IPv6 (fe80::/10)', () => {
      expect(isPrivateIp('fe80::1')).toBe(true)
    })

    it('bloque les IPv4 mappées en IPv6', () => {
      expect(isPrivateIp('::ffff:192.168.1.1')).toBe(true)
      expect(isPrivateIp('::ffff:169.254.169.254')).toBe(true)
    })

    it('bloque 100.64.0.0/10 (CGNAT)', () => {
      expect(isPrivateIp('100.64.0.0')).toBe(true)
      expect(isPrivateIp('100.127.255.255')).toBe(true)
    })
  })

  // ── IPs PUBLIQUES (doit retourner false) ──────────────────────────────────
  describe('IPs publiques à autoriser', () => {
    it('autorise 8.8.8.8 (Google DNS)', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false)
    })

    it('autorise 1.1.1.1 (Cloudflare)', () => {
      expect(isPrivateIp('1.1.1.1')).toBe(false)
    })

    it('autorise 172.32.0.1 (hors plage 172.16-31)', () => {
      expect(isPrivateIp('172.32.0.1')).toBe(false)
    })

    it('autorise 192.167.0.1 (hors plage 192.168)', () => {
      expect(isPrivateIp('192.167.0.1')).toBe(false)
    })

    it('autorise 11.0.0.1 (hors plage 10.x)', () => {
      expect(isPrivateIp('11.0.0.1')).toBe(false)
    })
  })
})
