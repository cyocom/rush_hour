export type UrgencyLevel = 'upcoming' | 'soon' | 'now'

export interface TrackedTeam {
  teamId: string
  displayName: string
  priorityRank: number
  createdAt: string
}

export interface MatchWindow {
  matchId: string
  startTime: string
  endTime: string
  participantTeamIds: string[]
  label: string
}

export interface UpcomingMatchAlert {
  alertId: string
  matchId: string
  trackedTeamsInMatch: string[]
  startTime: string
  urgency: UrgencyLevel
  priorityScore: number
  label: string
  endTime: string
}

export interface MatchConflict {
  conflictId: string
  startTime: string
  endTime: string
  impactedMatchIds: string[]
  impactedTrackedTeams: string[]
  highestPriorityTeamId?: string
}

export interface WatchSessionPreferences {
  trackedTeams: TrackedTeam[]
  lastUpdatedAt: string
  schemaVersion: string
}

export const SESSION_SCHEMA_VERSION = 'v1'
