import { describe, it, expect } from 'vitest'
import { buildShareUrl, decodeSharePayload, encodePayload, decodePayload } from '../../src/domain/services/shareUrl'

describe('shareUrl service', () => {
  describe('encodePayload / decodePayload', () => {
    it('should encode and decode a simple payload', () => {
      const original = { v: 1, teams: ['frc254', 'frc1678'] }
      const encoded = encodePayload(original)
      const decoded = decodePayload(encoded)

      expect(decoded).toEqual(original)
    })

    it('should handle payload with API key', () => {
      const original = { v: 1, teams: ['frc254'], key: 'test-api-key-123' }
      const encoded = encodePayload(original)
      const decoded = decodePayload(encoded)

      expect(decoded).toEqual(original)
    })

    it('should reject invalid Base64', () => {
      const decoded = decodePayload('!!!invalid base64!!!')
      expect(decoded).toBeNull()
    })

    it('should reject invalid JSON after Base64 decode', () => {
      const encoded = encodePayload({ v: 1, teams: [] })
      const corrupted = encoded.slice(0, -1) + 'X' // Corrupt last char
      const decoded = decodePayload(corrupted)

      expect(decoded).toBeNull()
    })

    it('should reject payload with wrong schema version', () => {
      const payload = { v: 2, teams: ['frc254'] }
      const encoded = encodePayload({ v: 2, teams: ['frc254'] } as any)
      const decoded = decodePayload(encoded)

      expect(decoded).toBeNull()
    })

    it('should reject payload without teams', () => {
      const encoded = encodePayload({ v: 1, teams: [] } as any)
      const decoded = decodePayload(encoded)

      expect(decoded).toBeNull()
    })

    it('should reject payload with non-string team IDs', () => {
      const encoded = encodePayload({ v: 1, teams: [123, 'frc254'] } as any)
      const decoded = decodePayload(encoded)

      expect(decoded).toBeNull()
    })

    it('should reject payload where teams is not an array', () => {
      const encoded = encodePayload({ v: 1, teams: 'frc254' } as any)
      const decoded = decodePayload(encoded)

      expect(decoded).toBeNull()
    })
  })

  describe('buildShareUrl / decodeSharePayload', () => {
    it('should build a URL with teams', () => {
      const url = buildShareUrl(['frc254', 'frc1678'], null)
      expect(url).toContain('/#/share/')
      expect(url).toMatch(/^https?:\/\/.+\/#\/share\/[A-Za-z0-9\-_]+$/)
    })

    it('should preserve base path when deployed under a subdirectory', () => {
      window.history.pushState({}, 'test', '/rush_hour/#/config')

      const url = buildShareUrl(['frc254'], null)
      expect(url).toContain('/rush_hour/#/share/')

      window.history.pushState({}, 'test', '/')
    })

    it('should include API key when includeApiKey is true', () => {
      const url = buildShareUrl(['frc254'], 'test-key', true)
      const encoded = url.split('/#/share/')[1]
      const decoded = decodeSharePayload(encoded)

      expect(decoded).not.toBeNull()
      expect(decoded!.apiKey).toEqual('test-key')
    })

    it('should exclude API key when includeApiKey is false', () => {
      const url = buildShareUrl(['frc254'], 'test-key', false)
      const encoded = url.split('/#/share/')[1]
      const decoded = decodeSharePayload(encoded)

      expect(decoded).not.toBeNull()
      expect(decoded!.apiKey).toBeNull()
    })

    it('should decode a valid share URL', () => {
      const teams = ['frc254', 'frc1678']
      const apiKey = 'test-key-123'
      const url = buildShareUrl(teams, apiKey)
      const encoded = url.split('/#/share/')[1]
      const decoded = decodeSharePayload(encoded)

      expect(decoded).not.toBeNull()
      expect(decoded!.teams).toEqual(teams)
      expect(decoded!.apiKey).toEqual(apiKey)
    })

    it('should return null for invalid payload', () => {
      const decoded = decodeSharePayload('!!!invalid!!!')
      expect(decoded).toBeNull()
    })

    it('should handle large team lists (100 teams)', () => {
      const teams = Array.from({ length: 100 }, (_, i) => `frc${1000 + i}`)
      const url = buildShareUrl(teams, null)

      // Verify URL length is reasonable (< 2000 chars per spec)
      expect(url.length).toBeLessThan(2000)

      // Verify it decodes correctly
      const encoded = url.split('/#/share/')[1]
      const decoded = decodeSharePayload(encoded)

      expect(decoded).not.toBeNull()
      expect(decoded!.teams).toEqual(teams)
    })

    it('should trim and validate API key', () => {
      const url = buildShareUrl(['frc254'], '', false) // Empty key should not be included
      const encoded = url.split('/#/share/')[1]
      const decoded = decodeSharePayload(encoded)

      expect(decoded).not.toBeNull()
      expect(decoded!.apiKey).toBeNull()
    })
  })

  describe('URL-safe Base64 properties', () => {
    it('should use URL-safe characters (no +, /, =)', () => {
      const payload = { v: 1, teams: ['frc254', 'frc1678', 'frc254b', 'frc1678b'] }
      const encoded = encodePayload(payload)

      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')
    })

    it('should be safe for use in URL paths', () => {
      const payload = { v: 1, teams: Array.from({ length: 50 }, (_, i) => `frc${1000 + i}`) }
      const encoded = encodePayload(payload)
      const url = `/#/share/${encoded}`

      // Should not contain any characters that need URL encoding
      expect(url).not.toMatch(/[^A-Za-z0-9\-_/#]/)
    })
  })
})
