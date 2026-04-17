import { afterEach, describe, expect, it } from 'vitest'
import type { WebcastOption } from '../../src/domain/models/schedule'
import {
  __setYouTubeAvailabilityProbeForTests,
  resolveWebcastAvailability,
} from '../../src/domain/services/streamAvailability'

function makeWebcast(overrides: Partial<WebcastOption>): WebcastOption {
  return {
    id: 'event:youtube:abc',
    platform: 'youtube',
    channel: 'UC12345678901234567890',
    eventKey: 'event',
    eventName: 'Event Name',
    label: 'Event Name · YouTube',
    embedUrl: 'https://www.youtube.com/embed/abc?autoplay=1&rel=0',
    externalUrl: 'https://www.youtube.com/watch?v=abc',
    availability: 'unknown',
    availabilityCheckedAt: null,
    ...overrides,
  }
}

afterEach(() => {
  __setYouTubeAvailabilityProbeForTests(null)
})

describe('resolveWebcastAvailability', () => {
  it('returns unsupported-provider for non-youtube options', async () => {
    const results = await resolveWebcastAvailability([
      makeWebcast({
        id: 'event:twitch:foo',
        platform: 'twitch',
        channel: 'foo',
        label: 'Event Name · Twitch',
        embedUrl: 'https://player.twitch.tv/?channel=foo',
        externalUrl: 'https://www.twitch.tv/foo',
      }),
    ])

    expect(results).toHaveLength(1)
    expect(results[0].reason).toBe('unsupported-provider')
    expect(results[0].availability).toBe('unknown')
  })

  it('maps probe success availability for youtube options', async () => {
    __setYouTubeAvailabilityProbeForTests(async () => 'offline')

    const results = await resolveWebcastAvailability([makeWebcast({ channel: 'UCaaaaaaaaaaaaaaaaaaaaaa' })])

    expect(results).toHaveLength(1)
    expect(results[0].reason).toBe('probe-success')
    expect(results[0].availability).toBe('offline')
  })

  it('maps probe errors to unknown', async () => {
    __setYouTubeAvailabilityProbeForTests(async () => {
      throw new Error('boom')
    })

    const results = await resolveWebcastAvailability([makeWebcast({ channel: 'UCbbbbbbbbbbbbbbbbbbbbbb' })])

    expect(results).toHaveLength(1)
    expect(results[0].reason).toBe('probe-error')
    expect(results[0].availability).toBe('unknown')
  })
})
