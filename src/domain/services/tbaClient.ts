import type { TBAEvent, TBAEventDetail, TBAMatchSimple } from '../models/schedule'

const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3'
const FALLBACK_TTL_MS = 300_000 // 5 min — used when server sends no Cache-Control
const CACHE_PREFIX = 'rushhour.tbaCache.'

export class TBAFetchError extends Error {
  readonly teamId: string | null
  readonly status: number | undefined

  constructor(
    message: string,
    teamId: string | null,
    status?: number,
  ) {
    super(message)
    this.name = 'TBAFetchError'
    this.teamId = teamId
    this.status = status
  }
}

interface CacheEntry<T> {
  data: T
  etag: string | null
  expiresAt: number // absolute ms timestamp
}

function cacheKey(url: string): string {
  return CACHE_PREFIX + encodeURIComponent(url)
}

function getCacheEntry<T>(url: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(cacheKey(url))
    if (!raw) return null
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    return null
  }
}

function setCacheEntry<T>(url: string, entry: CacheEntry<T>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(cacheKey(url), JSON.stringify(entry))
  } catch {
    // localStorage may be full — silently skip caching
  }
}

/** Parse `max-age=N` from a Cache-Control header value, returns ms or null. */
function parseMaxAgeMs(cacheControl: string | null): number | null {
  if (!cacheControl) return null
  const match = /max-age=(\d+)/.exec(cacheControl)
  return match ? parseInt(match[1], 10) * 1000 : null
}

async function fetchJson<T>(path: string, apiKey: string, teamId: string | null = null): Promise<T> {
  const url = `${TBA_BASE_URL}${path}`
  const cached = getCacheEntry<T>(url)

  // If cached data hasn't expired yet, return it immediately without hitting the network.
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  // Build request headers; include If-None-Match when we have a stored ETag.
  const headers: Record<string, string> = {
    'X-TBA-Auth-Key': apiKey,
    Accept: 'application/json',
  }
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag
  }

  const response = await fetch(url, { headers })

  // 304 Not Modified — server confirmed our cached data is still current.
  // Refresh the TTL so we don't revalidate again immediately.
  if (response.status === 304 && cached) {
    const maxAgeMs = parseMaxAgeMs(response.headers.get('Cache-Control')) ?? FALLBACK_TTL_MS
    setCacheEntry(url, { ...cached, expiresAt: Date.now() + maxAgeMs })
    return cached.data
  }

  if (!response.ok) {
    throw new TBAFetchError(
      `TBA request failed: ${response.status} ${response.statusText}`,
      teamId,
      response.status,
    )
  }

  const data = (await response.json()) as T
  const etag = response.headers.get('ETag')
  const maxAgeMs = parseMaxAgeMs(response.headers.get('Cache-Control')) ?? FALLBACK_TTL_MS
  setCacheEntry(url, { data, etag, expiresAt: Date.now() + maxAgeMs })
  return data
}

export function fetchTeamEvents(teamId: string, year: number, apiKey: string): Promise<TBAEvent[]> {
  return fetchJson<TBAEvent[]>(`/team/frc${teamId}/events/${year}/simple`, apiKey, teamId)
}

export function fetchEventMatches(eventKey: string, apiKey: string): Promise<TBAMatchSimple[]> {
  return fetchJson<TBAMatchSimple[]>(`/event/${eventKey}/matches/simple`, apiKey, null)
}

export function fetchEventDetail(eventKey: string, apiKey: string): Promise<TBAEventDetail> {
  return fetchJson<TBAEventDetail>(`/event/${eventKey}`, apiKey, null)
}
