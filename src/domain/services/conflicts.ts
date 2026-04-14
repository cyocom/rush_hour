import type { MatchConflict, UpcomingMatchAlert } from '../models/watch'

function overlaps(a: UpcomingMatchAlert, b: UpcomingMatchAlert): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

export function deriveMatchConflicts(alerts: UpcomingMatchAlert[]): MatchConflict[] {
  const conflicts: MatchConflict[] = []

  for (let i = 0; i < alerts.length; i += 1) {
    for (let j = i + 1; j < alerts.length; j += 1) {
      const first = alerts[i]
      const second = alerts[j]

      if (!overlaps(first, second)) {
        continue
      }

      const start = first.startTime > second.startTime ? first.startTime : second.startTime
      const end = first.endTime < second.endTime ? first.endTime : second.endTime
      const impactedTeams = Array.from(new Set([...first.trackedTeamsInMatch, ...second.trackedTeamsInMatch]))
      const highestPriorityTeamId = first.priorityScore <= second.priorityScore
        ? first.trackedTeamsInMatch[0]
        : second.trackedTeamsInMatch[0]

      conflicts.push({
        conflictId: `conflict-${first.matchId}-${second.matchId}`,
        startTime: start,
        endTime: end,
        impactedMatchIds: [first.matchId, second.matchId],
        impactedTrackedTeams: impactedTeams,
        highestPriorityTeamId,
      })
    }
  }

  return conflicts.sort((a, b) => a.startTime.localeCompare(b.startTime))
}
