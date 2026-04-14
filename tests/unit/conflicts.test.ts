import { addMinutes } from 'date-fns'
import { describe, expect, it } from 'vitest'
import type { UpcomingMatchAlert } from '../../src/domain/models/watch'
import { deriveMatchConflicts } from '../../src/domain/services/conflicts'

function iso(offset: number): string {
  return addMinutes(new Date(), offset).toISOString()
}

describe('deriveMatchConflicts', () => {
  it('returns overlap conflicts', () => {
    const alerts: UpcomingMatchAlert[] = [
      {
        alertId: 'a1',
        matchId: 'm1',
        trackedTeamsInMatch: ['frc254'],
        startTime: iso(10),
        endTime: iso(30),
        urgency: 'soon',
        priorityScore: 1,
        label: 'M1',
      },
      {
        alertId: 'a2',
        matchId: 'm2',
        trackedTeamsInMatch: ['frc1678'],
        startTime: iso(20),
        endTime: iso(40),
        urgency: 'upcoming',
        priorityScore: 2,
        label: 'M2',
      },
    ]

    const conflicts = deriveMatchConflicts(alerts)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].impactedMatchIds).toEqual(['m1', 'm2'])
  })
})
