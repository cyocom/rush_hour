import { differenceInMinutes, isBefore } from 'date-fns'
import type { MatchWindow, TrackedTeam, UpcomingMatchAlert, UrgencyLevel } from '../models/watch'

function getUrgency(startTime: string): UrgencyLevel {
  const now = new Date()
  const start = new Date(startTime)
  const diffMinutes = differenceInMinutes(start, now)

  if (diffMinutes <= 0) {
    return 'now'
  }

  if (diffMinutes <= 15) {
    return 'soon'
  }

  return 'upcoming'
}

function resolvePriorityScore(match: MatchWindow, trackedTeams: TrackedTeam[]): number {
  const indexed = new Map(trackedTeams.map((team) => [team.teamId.toLowerCase(), team.priorityRank]))
  const ranks = match.participantTeamIds
    .map((teamId) => indexed.get(teamId.toLowerCase()))
    .filter((rank): rank is number => typeof rank === 'number')

  if (ranks.length === 0) {
    return Number.MAX_SAFE_INTEGER
  }

  return Math.min(...ranks)
}

export function deriveUpcomingAlerts(matches: MatchWindow[], trackedTeams: TrackedTeam[]): UpcomingMatchAlert[] {
  const trackedSet = new Set(trackedTeams.map((team) => team.teamId.toLowerCase()))

  const alerts = matches
    .filter((match) => isBefore(new Date(), new Date(match.endTime)))
    .map((match) => {
      const trackedTeamsInMatch = match.participantTeamIds.filter((teamId) => trackedSet.has(teamId.toLowerCase()))
      return {
        alertId: `alert-${match.matchId}`,
        matchId: match.matchId,
        trackedTeamsInMatch,
        startTime: match.startTime,
        endTime: match.endTime,
        urgency: getUrgency(match.startTime),
        priorityScore: resolvePriorityScore(match, trackedTeams),
        label: match.label,
      }
    })
    .filter((alert) => alert.trackedTeamsInMatch.length > 0)

  const deduped = Array.from(new Map(alerts.map((alert) => [alert.matchId, alert])).values())

  return deduped.sort((a, b) => {
    const timeOrder = a.startTime.localeCompare(b.startTime)
    if (timeOrder !== 0) {
      return timeOrder
    }

    if (a.priorityScore !== b.priorityScore) {
      return a.priorityScore - b.priorityScore
    }

    return a.matchId.localeCompare(b.matchId)
  })
}
