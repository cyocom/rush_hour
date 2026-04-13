import { SESSION_SCHEMA_VERSION, type TrackedTeam, type WatchSessionPreferences } from '../models/watch'
import { normalizePriorityRanks } from '../validation/teams'

export const SESSION_STORAGE_KEY = 'rushhour.watchPreferences.v1'

export const DEFAULT_SESSION_PREFERENCES: WatchSessionPreferences = {
  trackedTeams: [],
  lastUpdatedAt: new Date(0).toISOString(),
  schemaVersion: SESSION_SCHEMA_VERSION,
}

function hasSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function readSessionPreferences(): WatchSessionPreferences {
  if (!hasSessionStorage()) {
    return DEFAULT_SESSION_PREFERENCES
  }

  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_SESSION_PREFERENCES
  }

  try {
    const parsed = JSON.parse(raw) as WatchSessionPreferences

    if (parsed.schemaVersion !== SESSION_SCHEMA_VERSION || !Array.isArray(parsed.trackedTeams)) {
      return DEFAULT_SESSION_PREFERENCES
    }

    const sortedTeams = normalizePriorityRanks(
      [...parsed.trackedTeams].sort((a, b) => a.priorityRank - b.priorityRank),
    )

    return {
      ...parsed,
      trackedTeams: sortedTeams,
    }
  } catch {
    return DEFAULT_SESSION_PREFERENCES
  }
}

export function writeSessionPreferences(trackedTeams: TrackedTeam[]): WatchSessionPreferences {
  const next: WatchSessionPreferences = {
    trackedTeams: normalizePriorityRanks(trackedTeams),
    lastUpdatedAt: new Date().toISOString(),
    schemaVersion: SESSION_SCHEMA_VERSION,
  }

  if (hasSessionStorage()) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next))
  }

  return next
}
