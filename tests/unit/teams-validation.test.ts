import { describe, expect, it } from 'vitest'
import { normalizePriorityRanks, validateTeamInput } from '../../src/domain/validation/teams'

describe('team validation and ranks', () => {
  it('rejects empty and duplicate team ids', () => {
    const teams = normalizePriorityRanks([
      { teamId: 'frc254', displayName: 'FRC254', priorityRank: 99, createdAt: new Date().toISOString() },
    ])

    expect(validateTeamInput(' ', teams)).toBeTruthy()
    expect(validateTeamInput('frc254', teams)).toBeTruthy()
  })

  it('normalizes priority ranks contiguously', () => {
    const normalized = normalizePriorityRanks([
      { teamId: 'a', displayName: 'A', priorityRank: 6, createdAt: new Date().toISOString() },
      { teamId: 'b', displayName: 'B', priorityRank: 9, createdAt: new Date().toISOString() },
    ])

    expect(normalized.map((team) => team.priorityRank)).toEqual([1, 2])
  })
})
