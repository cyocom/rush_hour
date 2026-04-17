import { format } from 'date-fns'
import type { MatchConflict } from '../models/watch'
import type { ScheduledMatchEntry, TBACompLevel, TBAEvent, TBAMatchSimple } from '../models/schedule'

type ScheduleBuilderLogLevel = 'silent' | 'info' | 'verbose'

function getScheduleBuilderLogLevel(): ScheduleBuilderLogLevel {
  const value = String(import.meta.env.VITE_SCHEDULE_BUILDER_LOG_LEVEL ?? 'verbose').toLowerCase()
  if (value === 'silent' || value === 'info' || value === 'verbose') {
    return value
  }
  return 'verbose'
}

function shouldLogScheduleBuilder(level: Exclude<ScheduleBuilderLogLevel, 'silent'>): boolean {
  if (!import.meta.env.DEV) return false
  const configured = getScheduleBuilderLogLevel()
  if (configured === 'silent') return false
  if (configured === 'info') return level === 'info'
  return true
}

function scheduleBuilderVerbose(message: string, ...args: unknown[]): void {
  if (!shouldLogScheduleBuilder('verbose')) return
  console.debug(`[scheduleBuilder][verbose] ${message}`, ...args)
}

const COMP_LEVEL_ORDER: Record<TBACompLevel, number> = {
  qm: 0,
  ef: 1,
  qf: 2,
  sf: 3,
  f: 4,
}

const COMP_LEVEL_LABELS: Record<TBACompLevel, string> = {
  qm: 'Quals',
  ef: 'Octos',
  qf: 'Quarters',
  sf: 'Semis',
  f: 'Finals',
}

/**
 * Returns the first event in `events` where effectiveDate falls within
 * [start_date, end_date] (inclusive, YYYY-MM-DD string comparison).
 */
export function findActiveEvent(events: TBAEvent[], effectiveDate: string): TBAEvent | null {
  scheduleBuilderVerbose(
    `findActiveEvent — effectiveDate: "${effectiveDate}", ${events.length} event(s)`,
  )
  let match: TBAEvent | null = null

  for (const event of events) {
    const inRange = effectiveDate >= event.start_date && effectiveDate <= event.end_date
    scheduleBuilderVerbose(
      `${inRange ? 'ACTIVE' : 'skip'} ${event.key} "${event.name}" [${event.start_date} -> ${event.end_date}]`,
    )
    if (inRange && match === null) {
      match = event
    }
  }

  if (match === null && shouldLogScheduleBuilder('info')) {
    console.info(`[scheduleBuilder][info] No active event found for effectiveDate "${effectiveDate}"`)
  }
  return match
}

/**
 * Filters to matches that are upcoming (not yet played) relative to effectiveTimeUnix.
 * A match is considered upcoming until TBA reports it as played (winner posted),
 * even if predicted_time has already passed.
 */
export function filterUpcomingMatches(
  matches: TBAMatchSimple[],
  effectiveTimeUnix: number,
  isSimulated = false,
): TBAMatchSimple[] {
  // TBA returns winning_alliance as "" (empty string) for unplayed matches, not null.
  // In simulated mode, keep using simulated timeline for played matches so users can
  // rewind to before completion.
  const upcoming = matches.filter((m) => {
    if (!m.winning_alliance) return true                  // score not posted yet
    if (m.predicted_time === null) return false
    if (isSimulated) return m.predicted_time > effectiveTimeUnix
    return false
  })
  scheduleBuilderVerbose(
    `filterUpcomingMatches: ${matches.length} total -> ${upcoming.length} upcoming (effectiveUnix=${effectiveTimeUnix})`,
    matches.map((m) => ({
      key: m.key,
      winning_alliance: m.winning_alliance,
      predicted_time: m.predicted_time,
    })),
  )
  return upcoming
}

/**
 * Derives a human-readable match label from comp level, set number, and match number.
 * Examples: "Quals 12", "Semis 1-2", "Finals 1"
 */
export function buildMatchLabel(match: TBAMatchSimple): string {
  const levelLabel = COMP_LEVEL_LABELS[match.comp_level] ?? match.comp_level.toUpperCase()
  if (match.comp_level === 'qm') {
    return `${levelLabel} ${match.match_number}`
  }
  return `${levelLabel} ${match.set_number}-${match.match_number}`
}

/**
 * Maps a raw TBAMatchSimple to a display-ready ScheduledMatchEntry.
 */
export function toScheduledMatchEntry(
  match: TBAMatchSimple,
  eventName: string,
  subscribedTeamIds: string[],
): ScheduledMatchEntry {
  const allTeamKeys = [
    ...match.alliances.red.team_keys,
    ...match.alliances.blue.team_keys,
  ]

  const subscribedTeamsInMatch = subscribedTeamIds.filter((teamId) =>
    allTeamKeys.includes(`frc${teamId}`),
  )

  const subscribedTeamAlliances: Record<string, 'red' | 'blue'> = {}
  for (const teamId of subscribedTeamsInMatch) {
    subscribedTeamAlliances[teamId] = match.alliances.red.team_keys.includes(`frc${teamId}`)
      ? 'red'
      : 'blue'
  }

  return {
    matchKey: match.key,
    eventKey: match.event_key,
    eventName,
    compLevel: match.comp_level,
    matchLabel: buildMatchLabel(match),
    allTeamKeys,
    subscribedTeamsInMatch,
    subscribedTeamAlliances,
    predictedTime: match.predicted_time,
    hasPredictedTime: match.predicted_time !== null,
    // TBA uses "" for unplayed matches and "red"/"blue" when played.
    isPlayed: !!match.winning_alliance,
  }
}

/**
 * Merges and sorts ScheduledMatchEntry[] into a single chronological list.
 * Primary: predictedTime ascending (nulls last).
 * Secondary: comp_level order (qm < ef < qf < sf < f), then match_number ascending.
 */
export function mergeAndSort(entries: ScheduledMatchEntry[]): ScheduledMatchEntry[] {
  return [...entries].sort((a, b) => {
    // Nulls last
    if (a.predictedTime === null && b.predictedTime === null) {
      return compareByLevel(a, b)
    }
    if (a.predictedTime === null) return 1
    if (b.predictedTime === null) return -1
    if (a.predictedTime !== b.predictedTime) {
      return a.predictedTime - b.predictedTime
    }
    return compareByLevel(a, b)
  })
}

function compareByLevel(a: ScheduledMatchEntry, b: ScheduledMatchEntry): number {
  const levelDiff =
    (COMP_LEVEL_ORDER[a.compLevel] ?? 0) - (COMP_LEVEL_ORDER[b.compLevel] ?? 0)
  if (levelDiff !== 0) return levelDiff
  return 0
}

/**
 * Formats a Unix timestamp (seconds) to a localized time string, e.g. "10:32 AM".
 * Returns null if predictedTime is null.
 */
export function formatMatchTime(predictedTime: number | null): string | null {
  if (predictedTime === null) return null
  try {
    return format(new Date(predictedTime * 1000), 'h:mm a')
  } catch {
    return null
  }
}

const CONFLICT_WINDOW_SECONDS = 5 * 60

/**
 * Returns the set of match keys that are involved in a time conflict (within
 * CONFLICT_WINDOW_SECONDS of another match).
 */
export function computeConflictMatchKeys(entries: ScheduledMatchEntry[]): Set<string> {
  const keys = new Set<string>()
  const timed = entries
    .filter((entry) => entry.predictedTime !== null)
    .slice()
    .sort((a, b) => (a.predictedTime ?? 0) - (b.predictedTime ?? 0))

  for (let i = 0; i < timed.length; i += 1) {
    const baseTime = timed[i].predictedTime!
    for (let j = i + 1; j < timed.length; j += 1) {
      const compareTime = timed[j].predictedTime!
      const delta = compareTime - baseTime
      if (delta > CONFLICT_WINDOW_SECONDS) break
      keys.add(timed[i].matchKey)
      keys.add(timed[j].matchKey)
    }
  }

  return keys
}

/**
 * Converts a set of conflicting match keys + the full entry list into
 * MatchConflict[] for rendering in ConflictList.
 */
export function toMatchConflicts(
  conflictKeys: Set<string>,
  entries: ScheduledMatchEntry[],
  teamPriorityById: Record<string, number> = {},
): MatchConflict[] {
  if (conflictKeys.size === 0) return []

  const conflicting = entries.filter((e) => conflictKeys.has(e.matchKey))

  const timed = conflicting
    .filter((e) => e.predictedTime !== null)
    .slice()
    .sort((a, b) => (a.predictedTime ?? 0) - (b.predictedTime ?? 0))

  const conflicts: MatchConflict[] = []
  const seen = new Set<string>()

  for (let i = 0; i < timed.length; i += 1) {
    for (let j = i + 1; j < timed.length; j += 1) {
      const a = timed[i]
      const b = timed[j]
      const delta = (b.predictedTime ?? 0) - (a.predictedTime ?? 0)
      if (delta > CONFLICT_WINDOW_SECONDS) break

      const pairKey = [a.matchKey, b.matchKey].sort().join('|')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const allTeams = Array.from(
        new Set([...a.subscribedTeamsInMatch, ...b.subscribedTeamsInMatch]),
      )
      const highestPriorityTeamId = allTeams
        .slice()
        .sort((teamA, teamB) => {
          const rankA = teamPriorityById[teamA] ?? Number.POSITIVE_INFINITY
          const rankB = teamPriorityById[teamB] ?? Number.POSITIVE_INFINITY
          if (rankA !== rankB) return rankA - rankB
          return teamA.localeCompare(teamB)
        })[0]

      conflicts.push({
        conflictId: `conflict-${a.matchKey}-${b.matchKey}`,
        startTime: new Date((a.predictedTime ?? 0) * 1000).toISOString(),
        endTime: new Date(((b.predictedTime ?? 0) + CONFLICT_WINDOW_SECONDS) * 1000).toISOString(),
        impactedMatchIds: [a.matchKey, b.matchKey],
        impactedTrackedTeams: allTeams,
        highestPriorityTeamId,
      })
    }
  }

  return conflicts
}
