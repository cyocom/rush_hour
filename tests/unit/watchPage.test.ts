import { describe, expect, it } from 'vitest'
import type { ScheduledMatchEntry, TBAEventDetail } from '../../src/domain/models/schedule'
import { buildWebcastOptions, deriveNextMatch } from '../../src/domain/services/watchPage'

function makeEntry(overrides: Partial<ScheduledMatchEntry>): ScheduledMatchEntry {
  return {
    matchKey: '2026tx_qm1',
    eventKey: '2026tx',
    eventName: 'TX District',
    compLevel: 'qm',
    matchLabel: 'Quals 1',
    allTeamKeys: ['frc254', 'frc1678', 'frc1114'],
    subscribedTeamsInMatch: ['254'],
    subscribedTeamAlliances: { '254': 'red' },
    predictedTime: 1_800,
    hasPredictedTime: true,
    isPlayed: false,
    ...overrides,
  }
}

function makeEvent(
  key: string,
  name: string,
  webcasts: TBAEventDetail['webcasts'],
): TBAEventDetail {
  return {
    key,
    name,
    start_date: '2026-03-01',
    end_date: '2026-03-03',
    event_type: 0,
    city: 'Houston',
    state_prov: 'TX',
    webcasts,
  }
}

describe('deriveNextMatch', () => {
  it('returns none when there are no candidate entries', () => {
    const result = deriveNextMatch([], 1_000)
    expect(result).toEqual({ status: 'none', entry: null, minutesUntil: null })
  })

  it('returns none when first candidate has null predicted time', () => {
    const entries = [makeEntry({ predictedTime: null, hasPredictedTime: false })]
    const result = deriveNextMatch(entries, 1_000)
    expect(result).toEqual({ status: 'none', entry: null, minutesUntil: null })
  })

  it('returns in-progress when first match already started and is not played', () => {
    const entries = [makeEntry({ predictedTime: 900, isPlayed: false })]
    const result = deriveNextMatch(entries, 1_000)
    expect(result.status).toBe('in-progress')
    expect(result.minutesUntil).toBe(0)
    expect(result.entry?.matchKey).toBe('2026tx_qm1')
  })

  it('returns soon when upcoming match is within 10 minutes', () => {
    const entries = [makeEntry({ predictedTime: 1_500, isPlayed: true }), makeEntry({ matchKey: '2026tx_qm2', predictedTime: 1_540 })]
    const result = deriveNextMatch(entries, 1_000)
    expect(result.status).toBe('soon')
    expect(result.minutesUntil).toBe(9)
    expect(result.entry?.matchKey).toBe('2026tx_qm2')
  })

  it('returns upcoming when next match is farther than 10 minutes', () => {
    const entries = [makeEntry({ predictedTime: 2_000 })]
    const result = deriveNextMatch(entries, 1_000)
    expect(result.status).toBe('upcoming')
    expect(result.minutesUntil).toBe(16)
  })

  it('keeps first entry for tie times (priority already encoded by caller sort)', () => {
    const entries = [
      makeEntry({ matchKey: 'a', predictedTime: 1_301, subscribedTeamsInMatch: ['254'] }),
      makeEntry({ matchKey: 'b', predictedTime: 1_301, subscribedTeamsInMatch: ['1678'] }),
    ]
    const result = deriveNextMatch(entries, 1_000)
    expect(result.entry?.matchKey).toBe('a')
  })
})

describe('buildWebcastOptions', () => {
  it('builds twitch and youtube embed URLs and deduplicates by type+channel', () => {
    const events = [
      makeEvent('2026tx', 'TX District', [
        { type: 'twitch', channel: 'firstinspires' },
        { type: 'youtube', channel: 'abc123video' },
      ]),
      makeEvent('2026ca', 'CA District', [
        { type: 'twitch', channel: 'firstinspires' },
      ]),
    ]

    const options = buildWebcastOptions(events, 'localhost', '2026tx')

    expect(options).toHaveLength(2)
    expect(options[0].platform).toBe('twitch')
    expect(options[0].embedUrl).toContain('player.twitch.tv')
    expect(options[0].embedUrl).toContain('parent=localhost')
    expect(options[1].platform).toBe('youtube')
    expect(options[1].embedUrl).toBe('https://www.youtube.com/embed/abc123video?autoplay=1&rel=0')
  })

  it('returns unsupported platform fallback with external URL', () => {
    const events = [
      makeEvent('2026pnw', 'PNW District', [
        { type: 'iframe', channel: 'custom', file: 'https://stream.example.com/watch' },
      ]),
    ]

    const options = buildWebcastOptions(events, 'rushhour.app')

    expect(options).toHaveLength(1)
    expect(options[0].platform).toBe('unsupported')
    expect(options[0].embedUrl).toBeNull()
    expect(options[0].externalUrl).toBe('https://stream.example.com/watch')
  })
})
