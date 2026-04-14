import { addMinutes } from 'date-fns'
import { describe, expect, it } from 'vitest'
import type { MatchWindow, TrackedTeam } from '../../src/domain/models/watch'
import { deriveUpcomingAlerts } from '../../src/domain/services/alerts'

function iso(offset: number): string {
  return addMinutes(new Date(), offset).toISOString()
}

describe('deriveUpcomingAlerts', () => {
  it('dedupes by match id and sorts by time then priority', () => {
    const teams: TrackedTeam[] = [
      { teamId: 'frc254', displayName: 'FRC254', priorityRank: 1, createdAt: iso(-10) },
      { teamId: 'frc1678', displayName: 'FRC1678', priorityRank: 2, createdAt: iso(-9) },
    ]

    const matches: MatchWindow[] = [
      { matchId: 'm2', label: 'M2', startTime: iso(10), endTime: iso(25), participantTeamIds: ['frc1678', 'frc1'] },
      { matchId: 'm1', label: 'M1', startTime: iso(5), endTime: iso(20), participantTeamIds: ['frc254', 'frc2'] },
      { matchId: 'm1', label: 'M1 duplicate', startTime: iso(5), endTime: iso(20), participantTeamIds: ['frc254', 'frc3'] },
    ]

    const alerts = deriveUpcomingAlerts(matches, teams)

    expect(alerts).toHaveLength(2)
    expect(alerts[0].matchId).toBe('m1')
    expect(alerts[1].matchId).toBe('m2')
  })
})
