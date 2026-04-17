import type {
  AvailabilityProbeResult,
  AvailabilityProbeReason,
  StreamAvailability,
  WebcastOption,
} from '../models/schedule'

const YOUTUBE_PROBE_TIMEOUT_MS = 2500
const YOUTUBE_DATA_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

function logVerbose(message: string, context?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return
  if (context) {
    console.debug(`[streamAvailability][verbose] ${message}`, context)
    return
  }
  console.debug(`[streamAvailability][verbose] ${message}`)
}

export type YouTubeAvailabilityProbe = (channel: string) => Promise<StreamAvailability>

let youtubeAvailabilityProbe: YouTubeAvailabilityProbe | null = null

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error('timeout'))
    }, timeoutMs)

    promise
      .then((value) => {
        globalThis.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        globalThis.clearTimeout(timer)
        reject(error)
      })
  })
}

function readYouTubeApiKey(): string | null {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY
  if (typeof key !== 'string' || key.trim().length === 0) return null
  return key.trim()
}

type YouTubeIdentifier =
  | { kind: 'video'; value: string }
  | { kind: 'channel'; value: string }
  | { kind: 'handle'; value: string }
  | { kind: 'unknown'; value: string }

function parseYouTubeIdentifier(rawValue: string): YouTubeIdentifier {
  const value = rawValue.trim()
  if (!value) return { kind: 'unknown', value }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      const host = parsed.hostname.toLowerCase()
      const pathname = parsed.pathname

      if (host === 'youtu.be') {
        const shortId = pathname.replace(/^\//, '')
        if (/^[\w-]{11}$/.test(shortId)) {
          return { kind: 'video', value: shortId }
        }
      }

      if (host.includes('youtube.com')) {
        const videoId = parsed.searchParams.get('v')
        if (videoId && /^[\w-]{11}$/.test(videoId)) {
          return { kind: 'video', value: videoId }
        }

        const pathParts = pathname.split('/').filter(Boolean)

        if (pathParts[0] === 'live' && /^[\w-]{11}$/.test(pathParts[1] ?? '')) {
          return { kind: 'video', value: pathParts[1] }
        }

        if (pathParts[0] === 'channel' && /^UC[\w-]{20,}$/.test(pathParts[1] ?? '')) {
          return { kind: 'channel', value: pathParts[1] }
        }

        if (pathParts[0]?.startsWith('@')) {
          return { kind: 'handle', value: pathParts[0].slice(1) }
        }
      }
    } catch {
      // Fall through to plain token parsing.
    }
  }

  if (/^UC[\w-]{20,}$/.test(value)) {
    return { kind: 'channel', value }
  }

  if (/^[\w-]{11}$/.test(value)) {
    return { kind: 'video', value }
  }

  if (value.startsWith('@') && value.length > 1) {
    return { kind: 'handle', value: value.slice(1) }
  }

  if (/^[A-Za-z0-9._-]{3,}$/.test(value)) {
    return { kind: 'handle', value }
  }

  return { kind: 'unknown', value }
}

async function fetchYouTubeDataApi(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<Response> {
  const url = new URL(`${YOUTUBE_DATA_API_BASE_URL}${path}`)

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  url.searchParams.set('key', apiKey)

  return withTimeout(fetch(url.toString()), YOUTUBE_PROBE_TIMEOUT_MS)
}

async function classifyVideoId(videoId: string, apiKey: string): Promise<StreamAvailability> {
  const response = await fetchYouTubeDataApi(
    '/videos',
    {
      part: 'liveStreamingDetails,status',
      id: videoId,
      maxResults: '1',
    },
    apiKey,
  )

  logVerbose('YouTube videos API response', {
    videoId,
    status: response.status,
    ok: response.ok,
  })

  if (!response.ok) return 'unknown'

  const data = (await response.json()) as {
    items?: Array<{
      liveStreamingDetails?: {
        actualStartTime?: string
        actualEndTime?: string
      }
    }>
  }

  const item = data.items?.[0]
  if (!item) return 'offline'

  const details = item.liveStreamingDetails
  if (!details) return 'offline'
  if (details.actualStartTime && !details.actualEndTime) return 'online'

  return 'offline'
}

async function classifyChannelId(channelId: string, apiKey: string): Promise<StreamAvailability> {
  const response = await fetchYouTubeDataApi(
    '/search',
    {
      part: 'id',
      channelId,
      eventType: 'live',
      type: 'video',
      maxResults: '1',
    },
    apiKey,
  )

  logVerbose('YouTube search API response', {
    channelId,
    status: response.status,
    ok: response.ok,
  })

  if (!response.ok) return 'unknown'

  const data = (await response.json()) as { items?: unknown[] }
  return (data.items?.length ?? 0) > 0 ? 'online' : 'offline'
}

async function resolveChannelIdFromHandle(handle: string, apiKey: string): Promise<string | null> {
  const forHandleResponse = await fetchYouTubeDataApi(
    '/channels',
    {
      part: 'id',
      forHandle: handle,
      maxResults: '1',
    },
    apiKey,
  )

  logVerbose('YouTube channels(forHandle) API response', {
    handle,
    status: forHandleResponse.status,
    ok: forHandleResponse.ok,
  })

  if (forHandleResponse.ok) {
    const forHandleData = (await forHandleResponse.json()) as { items?: Array<{ id?: string }> }
    const channelId = forHandleData.items?.[0]?.id
    if (channelId) return channelId
  }

  const forUsernameResponse = await fetchYouTubeDataApi(
    '/channels',
    {
      part: 'id',
      forUsername: handle,
      maxResults: '1',
    },
    apiKey,
  )

  logVerbose('YouTube channels(forUsername) API response', {
    handle,
    status: forUsernameResponse.status,
    ok: forUsernameResponse.ok,
  })

  if (!forUsernameResponse.ok) return null

  const forUsernameData = (await forUsernameResponse.json()) as { items?: Array<{ id?: string }> }
  return forUsernameData.items?.[0]?.id ?? null
}

async function defaultYouTubeAvailabilityProbe(channel: string): Promise<StreamAvailability> {
  const apiKey = readYouTubeApiKey()
  if (!apiKey) {
    logVerbose('YouTube API key missing; cannot classify stream availability', {
      channel,
      expectedEnvVar: 'VITE_YOUTUBE_API_KEY',
    })
    return 'unknown'
  }

  const identifier = parseYouTubeIdentifier(channel)

  logVerbose('Classifying youtube stream via Data API', {
    channel,
    identifier,
    timeoutMs: YOUTUBE_PROBE_TIMEOUT_MS,
  })

  try {
    if (identifier.kind === 'video') {
      return classifyVideoId(identifier.value, apiKey)
    }

    if (identifier.kind === 'channel') {
      return classifyChannelId(identifier.value, apiKey)
    }

    if (identifier.kind === 'handle') {
      const channelId = await resolveChannelIdFromHandle(identifier.value, apiKey)
      if (!channelId) {
        logVerbose('Unable to resolve channel id from handle', {
          handle: identifier.value,
        })
        return 'unknown'
      }
      return classifyChannelId(channelId, apiKey)
    }
  } catch (error) {
    logVerbose('YouTube Data API classification error', {
      channel,
      error: error instanceof Error ? error.message : String(error),
    })
    return 'unknown'
  }

  logVerbose('Unable to classify youtube stream identifier', {
    channel,
    identifier,
  })
  return 'unknown'
}

function buildProbeResult(
  webcastId: string,
  availability: StreamAvailability,
  reason: AvailabilityProbeReason,
): AvailabilityProbeResult {
  return {
    webcastId,
    availability,
    checkedAt: new Date().toISOString(),
    reason,
  }
}

export async function resolveWebcastAvailability(
  webcasts: WebcastOption[],
): Promise<AvailabilityProbeResult[]> {
  const probe = youtubeAvailabilityProbe ?? defaultYouTubeAvailabilityProbe

  logVerbose('Resolving webcast availability for batch', {
    count: webcasts.length,
    webcastIds: webcasts.map((webcast) => webcast.id),
  })

  const results = await Promise.all(
    webcasts.map(async (webcast): Promise<AvailabilityProbeResult> => {
      if (webcast.platform !== 'youtube') {
        logVerbose('Skipping non-youtube webcast', {
          webcastId: webcast.id,
          platform: webcast.platform,
        })
        return buildProbeResult(webcast.id, 'unknown', 'unsupported-provider')
      }

      try {
        const availability = await withTimeout(probe(webcast.channel), YOUTUBE_PROBE_TIMEOUT_MS)
        logVerbose('Probe completed', {
          webcastId: webcast.id,
          channel: webcast.channel,
          availability,
        })
        return buildProbeResult(webcast.id, availability, 'probe-success')
      } catch (error) {
        if (error instanceof Error && error.message === 'timeout') {
          logVerbose('Probe timed out', {
            webcastId: webcast.id,
            channel: webcast.channel,
          })
          return buildProbeResult(webcast.id, 'unknown', 'probe-timeout')
        }
        logVerbose('Probe errored', {
          webcastId: webcast.id,
          channel: webcast.channel,
          error: error instanceof Error ? error.message : String(error),
        })
        return buildProbeResult(webcast.id, 'unknown', 'probe-error')
      }
    }),
  )

  logVerbose('Resolved webcast availability batch', {
    results,
  })

  return results
}

export function __setYouTubeAvailabilityProbeForTests(
  probe: YouTubeAvailabilityProbe | null,
): void {
  youtubeAvailabilityProbe = probe
}
