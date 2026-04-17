import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/app/App'
import {
  APP_PREFERENCES_SCHEMA_VERSION,
} from '../../src/domain/models/schedule'
import * as tbaClient from '../../src/domain/services/tbaClient'

vi.mock('../../src/domain/services/tbaClient', () => ({
  fetchTeamEvents: vi.fn(),
  fetchEventMatches: vi.fn(),
  fetchEventDetail: vi.fn(),
}))

vi.mock('../../src/domain/services/persistentPreferences', () => ({
  readPersistentPreferences: vi.fn(() => ({
    schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
    tbaApiKey: 'test-key',
    subscribedTeams: [
      { teamId: '254', addedAt: '2026-03-10T00:00:00.000Z' },
      { teamId: '1678', addedAt: '2026-03-10T00:00:01.000Z' },
    ],
    simulationClock: {
      enabled: true,
      simulatedISOString: '2026-03-12T12:00:00.000Z',
      running: false,
      startedAtISOString: null,
    },
  })),
  getEffectiveTime: vi.fn(() => new Date('2026-03-12T12:00:00.000Z')),
}))

describe('watch page', () => {
  const fetchTeamEventsMock = vi.mocked(tbaClient.fetchTeamEvents)
  const fetchEventMatchesMock = vi.mocked(tbaClient.fetchEventMatches)
  const fetchEventDetailMock = vi.mocked(tbaClient.fetchEventDetail)

  beforeEach(() => {
    vi.clearAllMocks()

    fetchTeamEventsMock.mockResolvedValue([
      {
        key: '2026txhou',
        name: 'Houston District',
        start_date: '2026-03-10',
        end_date: '2026-03-14',
        event_type: 0,
        city: 'Houston',
        state_prov: 'TX',
      },
    ])

    fetchEventMatchesMock.mockResolvedValue([
      {
        key: '2026txhou_qm1',
        event_key: '2026txhou',
        comp_level: 'qm',
        set_number: 1,
        match_number: 1,
        alliances: {
          red: { team_keys: ['frc254', 'frc1114', 'frc2056'], score: null },
          blue: { team_keys: ['frc1678', 'frc971', 'frc118'], score: null },
        },
        time: null,
        predicted_time: 1_893_456_000,
        actual_time: null,
        winning_alliance: null,
      },
      {
        key: '2026txhou_qm2',
        event_key: '2026txhou',
        comp_level: 'qm',
        set_number: 1,
        match_number: 2,
        alliances: {
          red: { team_keys: ['frc254', 'frc148', 'frc3310'], score: null },
          blue: { team_keys: ['frc604', 'frc987', 'frc3476'], score: null },
        },
        time: null,
        predicted_time: 1_893_456_180,
        actual_time: null,
        winning_alliance: null,
      },
    ])

    fetchEventDetailMock.mockResolvedValue({
      key: '2026txhou',
      name: 'Houston District',
      start_date: '2026-03-10',
      end_date: '2026-03-14',
      event_type: 0,
      city: 'Houston',
      state_prov: 'TX',
      webcasts: [
        { type: 'twitch', channel: 'firstinspires' },
        { type: 'youtube', channel: 'abc123video' },
      ],
    })
  })

  it('shows live webcast panel, alerts, and conflicts', async () => {
    window.history.pushState({}, '', '/#/watch')
    render(<App />)

    expect(await screen.findByTestId('watch-stream-panel')).toBeInTheDocument()
    expect(await screen.findByTestId('watch-alert-list')).toBeInTheDocument()
    expect(await screen.findByTestId('watch-conflict-list')).toBeInTheDocument()
  })
})
