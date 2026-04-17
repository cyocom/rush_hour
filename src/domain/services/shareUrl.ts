/**
 * URL-safe Base64 encoding/decoding for share payloads
 */

export interface SharePayload {
  v: 1
  teams: string[]
  key?: string
}

export interface DecodedSharePayload {
  teams: string[]
  apiKey: string | null
}

/**
 * Encodes a share payload to URL-safe Base64
 */
export function encodePayload(payload: SharePayload): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Decodes a URL-safe Base64 string to a share payload.
 * Returns null if the payload is invalid (bad Base64, bad JSON, or invalid schema).
 */
export function decodePayload(encoded: string): SharePayload | null {
  try {
    // Restore standard Base64 padding
    const remainder = encoded.length % 4
    const padAmount = remainder ? 4 - remainder : 0
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padAmount)
    const json = atob(padded)
    const parsed = JSON.parse(json)

    // Validate schema
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    if (parsed.v !== 1) {
      return null
    }

    if (!Array.isArray(parsed.teams) || parsed.teams.length === 0 || !parsed.teams.every((t: unknown) => typeof t === 'string')) {
      return null
    }

    if (parsed.key !== undefined && typeof parsed.key !== 'string') {
      return null
    }

    return parsed as SharePayload
  } catch {
    return null
  }
}

/**
 * Builds a share URL for the given teams and API key.
 * Returns the full URL with origin and hash path.
 */
export function buildShareUrl(teams: string[], apiKey: string | null, includeApiKey: boolean = true): string {
  const payload: SharePayload = {
    v: 1,
    teams,
  }

  if (includeApiKey && apiKey) {
    payload.key = apiKey
  }

  const encoded = encodePayload(payload)
  if (typeof window === 'undefined') {
    return `/#/share/${encoded}`
  }

  const origin = window.location.origin
  // Preserve deploy sub-paths like /rush_hour/ when building share URLs.
  const normalizedPath = window.location.pathname.replace(/\/$/, '')
  const basePath = normalizedPath === '/' ? '' : normalizedPath
  return `${origin}${basePath}/#/share/${encoded}`
}

/**
 * Decodes a share payload and returns the decoded teams and API key.
 * Returns null if the payload is invalid.
 */
export function decodeSharePayload(encoded: string): DecodedSharePayload | null {
  const payload = decodePayload(encoded)
  if (!payload) {
    return null
  }

  return {
    teams: payload.teams,
    apiKey: payload.key ?? null,
  }
}
