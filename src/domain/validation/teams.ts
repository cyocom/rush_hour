import type { TrackedTeam } from '../models/watch'

export function normalizeTeamId(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isDuplicateTeam(teamId: string, teams: TrackedTeam[]): boolean {
  const normalized = normalizeTeamId(teamId)
  return teams.some((team) => normalizeTeamId(team.teamId) === normalized)
}

export function normalizePriorityRanks(teams: TrackedTeam[]): TrackedTeam[] {
  return teams.map((team, index) => ({
    ...team,
    priorityRank: index + 1,
  }))
}

export function validateTeamInput(teamId: string, teams: TrackedTeam[]): string | null {
  const normalized = normalizeTeamId(teamId)

  if (!normalized) {
    return 'Enter a team id to continue.'
  }

  if (isDuplicateTeam(normalized, teams)) {
    return 'That team is already being tracked.'
  }

  return null
}
