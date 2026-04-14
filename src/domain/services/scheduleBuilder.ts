import { format } from 'date-fns'
import type { ScheduledMatchEntry, TBACompLevel, TBAEvent, TBAMatchSimple } from '../models/schedule'

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
  if (import.meta.env.DEV) {
    console.group(`[scheduleBuilder] findActiveEvent — effectiveDate: "${effectiveDate}", ${events.length} event(s)`)
  }
  let match: TBAEvent | null = null

  for (const event of events) {
    const inRange = effectiveDate >= event.start_date && effectiveDate <= event.end_date
    if (import.meta.env.DEV) {
      console.log(
        `  ${inRange ? '✅' : '❌'} ${event.key} "${event.name}" [${event.start_date} → ${event.end_date}]${inRange ? ' ← ACTIVE' : ''}`,
      )
    }
    if (inRange && match === null) {
      match = event
    }
  }

  if (import.meta.env.DEV) {
    if (match === null) console.warn(`  ⚠️  No active event found for effectiveDate "${effectiveDate}"`)
    console.groupEnd()
  }
  return match
}

/**
 * Filters to matches that are upcoming (not yet played) relative to effectiveTimeUnix.
 * - Matches with `predicted_time > effectiveTimeUnix` are included.
 * - Matches with `predicted_time === null` and `winning_alliance === null` are included
 *   (edge case: time unavailable, but match hasn't been played).
 */
export function filterUpcomingMatches(
  matches: TBAMatchSimple[],
  effectiveTimeUnix: number,
  isSimulated = false,
): TBAMatchSimple[] {
  // TBA returns winning_alliance as "" (empty string) for unplayed matches, not null.
  // When simulating, a match may already have a TBA result but the simulated time is
  // before it was played — so skip the winner check and rely solely on predicted_time.
  const upcoming = matches.filter((m) => {
    if (!isSimulated && m.winning_alliance) return false  // already has a winner (live mode only)
    if (m.predicted_time === null) return true            // no time yet → include
    return m.predicted_time > effectiveTimeUnix
  })
  if (import.meta.env.DEV) {
    console.log(
      `[scheduleBuilder] filterUpcomingMatches: ${matches.length} total → ${upcoming.length} upcoming` +
      ` (effectiveUnix=${effectiveTimeUnix})`,
      matches.map((m) => ({ key: m.key, winning_alliance: m.winning_alliance, predicted_time: m.predicted_time })),
    )
  }
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
    isPlayed: match.winning_alliance !== null,
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
