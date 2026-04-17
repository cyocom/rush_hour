import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import type {
  NextMatchInfo,
  NextMatchStatus,
  ScheduledMatchEntry,
  TBAEventDetail,
  UnifiedSchedule,
  WatchPageLoadStatus,
  WatchPageState,
  WebcastOption,
  WebcastPlatform,
} from '../models/schedule'
import type { TeamScheduleStatus } from '../models/schedule'
import {
  findActiveEvent,
  filterUpcomingMatches,
  mergeAndSort,
  toScheduledMatchEntry,
} from './scheduleBuilder'
import { getEffectiveTime, readPersistentPreferences } from './persistentPreferences'
import { fetchEventDetail, fetchEventMatches, fetchTeamEvents } from './tbaClient'

const CURRENT_SEASON_YEAR = new Date().getFullYear()
const SOON_THRESHOLD_SECONDS = 600 // 10 minutes
const WATCH_DATA_REFRESH_MS = 60_000

// ─── Pure functions ──────────────────────────────────────────────────────────

/**
 * Derives which match is "next" across all subscribed teams, based on sorted
 * ScheduledMatchEntry[] (ascending predictedTime, nulls last).
 */
export function deriveNextMatch(
  entries: ScheduledMatchEntry[],
  effectiveUnix: number,
): NextMatchInfo {
  const candidates = entries.filter(
    (e) => e.subscribedTeamsInMatch.length > 0 && !e.isPlayed,
  )

  if (candidates.length === 0) {
    return { status: 'none', entry: null, minutesUntil: null }
  }

  const first = candidates[0]

  // No predicted time for first entry — cannot determine status
  if (first.predictedTime === null) {
    return { status: 'none', entry: null, minutesUntil: null }
  }

  // Keep as upcoming until TBA reports match as played (score posted).
  if (first.predictedTime <= effectiveUnix && !first.isPlayed) {
    return { status: 'upcoming', entry: first, minutesUntil: 0 }
  }

  // If first entry is already played, find next upcoming
  const upcoming = candidates.find(
    (e) => e.predictedTime !== null && e.predictedTime > effectiveUnix,
  )

  if (!upcoming || upcoming.predictedTime === null) {
    return { status: 'none', entry: null, minutesUntil: null }
  }

  const secondsUntil = upcoming.predictedTime - effectiveUnix
  const minutesUntil = Math.max(0, Math.floor(secondsUntil / 60))
  const status: NextMatchStatus = secondsUntil <= SOON_THRESHOLD_SECONDS ? 'soon' : 'upcoming'

  return { status, entry: upcoming, minutesUntil }
}

/**
 * Builds the ordered, deduplicated list of WebcastOption[] from fetched event
 * details. The event for the next upcoming match comes first; remaining events
 * follow in the order they were passed. Duplicates (same type+channel) are
 * dropped after the first occurrence.
 */
export function buildWebcastOptions(
  eventDetails: TBAEventDetail[],
  hostname: string,
  priorityEventKey?: string,
): WebcastOption[] {
  // Sort so priority event comes first
  const sorted = priorityEventKey
    ? [
        ...eventDetails.filter((e) => e.key === priorityEventKey),
        ...eventDetails.filter((e) => e.key !== priorityEventKey),
      ]
    : eventDetails

  const seen = new Set<string>()
  const options: WebcastOption[] = []

  for (const event of sorted) {
    for (const wc of event.webcasts) {
      const dupKey = `${wc.type}:${wc.channel}`
      if (seen.has(dupKey)) continue
      seen.add(dupKey)

      const platform: WebcastPlatform =
        wc.type === 'twitch' ? 'twitch' : wc.type === 'youtube' ? 'youtube' : 'unsupported'

      let embedUrl: string | null = null
      let externalUrl: string

      if (platform === 'twitch') {
        embedUrl = `https://player.twitch.tv/?channel=${encodeURIComponent(wc.channel)}&parent=${hostname}&autoplay=true`
        externalUrl = `https://www.twitch.tv/${wc.channel}`
      } else if (platform === 'youtube') {
        embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(wc.channel)}?autoplay=1&rel=0`
        externalUrl = `https://www.youtube.com/watch?v=${wc.channel}`
      } else {
        externalUrl =
          wc.file && wc.file.length > 0
            ? wc.file
            : `https://www.thebluealliance.com/event/${event.key}`
      }

      const platformLabel =
        platform === 'twitch' ? 'Twitch' : platform === 'youtube' ? 'YouTube' : wc.type

      options.push({
        id: `${event.key}:${wc.type}:${wc.channel}`,
        platform,
        channel: wc.channel,
        eventKey: event.key,
        eventName: event.name,
        label: `${event.name} · ${platformLabel}`,
        embedUrl,
        externalUrl,
      })
    }
  }

  return options
}

// ─── Data hook ───────────────────────────────────────────────────────────────

export function useWatchPageData(): WatchPageState {
  const [loadStatus, setLoadStatus] = useState<WatchPageLoadStatus>('idle')
  const [schedule, setSchedule] = useState<UnifiedSchedule | null>(null)
  const [webcasts, setWebcasts] = useState<WebcastOption[]>([])
  const [selectedWebcastId, setSelectedWebcastId] = useState<string | null>(null)
  const [noApiKey, setNoApiKey] = useState(false)
  const [noSubscribedTeams, setNoSubscribedTeams] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load(showLoading: boolean) {
      const prefs = readPersistentPreferences()

      if (!prefs.tbaApiKey) {
        if (cancelled) return
        setNoApiKey(true)
        setNoSubscribedTeams(false)
        setSchedule(null)
        setWebcasts([])
        setSelectedWebcastId(null)
        setLoadStatus('done')
        return
      }

      if (prefs.subscribedTeams.length === 0) {
        if (cancelled) return
        setNoSubscribedTeams(true)
        setNoApiKey(false)
        setSchedule(null)
        setWebcasts([])
        setSelectedWebcastId(null)
        setLoadStatus('done')
        return
      }

      if (!cancelled) {
        setNoApiKey(false)
        setNoSubscribedTeams(false)
        if (showLoading) {
          setLoadStatus('loading')
        }
      }

      const apiKey = prefs.tbaApiKey
      const teams = prefs.subscribedTeams
      const subscribedTeamIds = teams.map((t) => t.teamId)
      const isSimulated = prefs.simulationClock.enabled && !!prefs.simulationClock.simulatedISOString
      const effectiveDate = getEffectiveTime()
      const effectiveDateStr = format(effectiveDate, 'yyyy-MM-dd')
      const effectiveUnix = Math.floor(effectiveDate.getTime() / 1000)
      const year = effectiveDate.getFullYear() || CURRENT_SEASON_YEAR

      // ── 1. Fetch events for all teams in parallel ─────────────────────────
      const eventResults = await Promise.allSettled(
        teams.map((team) => fetchTeamEvents(team.teamId, year, apiKey)),
      )

      const teamStatuses: TeamScheduleStatus[] = []
      const activeEventKeys: string[] = []
      const activeEventByTeam: Map<string, { key: string; name: string }> = new Map()
      const matchFetchTasks: Array<
        Promise<{ teamId: string; entries: ScheduledMatchEntry[]; eventKey: string }>
      > = []

      eventResults.forEach((result, i) => {
        const teamId = teams[i].teamId

        if (result.status === 'rejected') {
          teamStatuses.push({
            teamId,
            status: 'error',
            eventKey: null,
            eventName: null,
            errorMessage: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          })
          return
        }

        const activeEvent = findActiveEvent(result.value, effectiveDateStr)

        if (!activeEvent) {
          teamStatuses.push({
            teamId,
            status: 'no-event',
            eventKey: null,
            eventName: null,
            errorMessage: null,
          })
          return
        }

        teamStatuses.push({
          teamId,
          status: 'ok',
          eventKey: activeEvent.key,
          eventName: activeEvent.name,
          errorMessage: null,
        })

        if (!activeEventKeys.includes(activeEvent.key)) {
          activeEventKeys.push(activeEvent.key)
        }
        activeEventByTeam.set(teamId, { key: activeEvent.key, name: activeEvent.name })

        matchFetchTasks.push(
          fetchEventMatches(activeEvent.key, apiKey).then((matches) => {
            const upcoming = filterUpcomingMatches(matches, effectiveUnix, isSimulated)
            const entries = upcoming.map((m) =>
              toScheduledMatchEntry(m, activeEvent.name, subscribedTeamIds),
            )
            return { teamId, entries, eventKey: activeEvent.key }
          }),
        )
      })

      // ── 2. Fetch matches + event details for active events in parallel ────
      const [matchResults, detailResults] = await Promise.all([
        Promise.allSettled(matchFetchTasks),
        Promise.allSettled(activeEventKeys.map((key) => fetchEventDetail(key, apiKey))),
      ])

      // ── 3. Collapse match results ─────────────────────────────────────────
      const allEntries: ScheduledMatchEntry[] = []
      let okTaskIndex = 0
      matchResults.forEach((result) => {
        if (result.status === 'rejected') {
          // Find nth 'ok' status to mark as error
          let found = 0
          for (let k = 0; k < teamStatuses.length; k += 1) {
            if (teamStatuses[k].status === 'ok') {
              if (found === okTaskIndex) {
                teamStatuses[k] = {
                  ...teamStatuses[k],
                  status: 'error',
                  errorMessage:
                    result.reason instanceof Error ? result.reason.message : 'Failed to load matches',
                }
                break
              }
              found += 1
            }
          }
          okTaskIndex += 1
          return
        }
        okTaskIndex += 1
        allEntries.push(...result.value.entries)
      })

      // Deduplicate matches (same match via multiple subscribed teams)
      const seen = new Set<string>()
      const deduped: ScheduledMatchEntry[] = []
      for (const entry of allEntries) {
        if (!seen.has(entry.matchKey)) {
          seen.add(entry.matchKey)
          deduped.push(entry)
        } else {
          const existing = deduped.find((e) => e.matchKey === entry.matchKey)
          if (existing) {
            const merged = new Set([
              ...existing.subscribedTeamsInMatch,
              ...entry.subscribedTeamsInMatch,
            ])
            existing.subscribedTeamsInMatch = [...merged]
            existing.subscribedTeamAlliances = {
              ...entry.subscribedTeamAlliances,
              ...existing.subscribedTeamAlliances,
            }
          }
        }
      }

      const sorted = mergeAndSort(deduped.filter((e) => e.subscribedTeamsInMatch.length > 0))

      const unifiedSchedule: UnifiedSchedule = {
        entries: sorted,
        teamStatuses,
        effectiveTime: effectiveDate.toISOString(),
        isSimulated,
      }

      // ── 4. Build webcast options ──────────────────────────────────────────
      const eventDetails: TBAEventDetail[] = []
      detailResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          eventDetails.push(result.value)
        }
        // Silent on failed event detail — webcasts will just be missing for that event
      })

      // Determine priority event key: event of the soonest upcoming match
      const nextMatch = deriveNextMatch(sorted, effectiveUnix)
      const priorityEventKey = nextMatch.entry?.eventKey ?? activeEventKeys[0]

      const hostname =
        typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      const webcastOptions = buildWebcastOptions(eventDetails, hostname, priorityEventKey)

      if (cancelled) return

      setSchedule(unifiedSchedule)
      setWebcasts(webcastOptions)
      setSelectedWebcastId((current) => {
        if (current && webcastOptions.some((option) => option.id === current)) {
          return current
        }
        return webcastOptions[0]?.id ?? null
      })
      setLoadStatus('done')
    }

    load(true).catch(() => {
      if (!cancelled) {
        setLoadStatus('done')
      }
    })

    const timer = window.setInterval(() => {
      load(false).catch(() => {
        if (!cancelled) {
          setLoadStatus('done')
        }
      })
    }, WATCH_DATA_REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return {
    loadStatus,
    schedule,
    webcasts,
    selectedWebcastId,
    noApiKey,
    noSubscribedTeams,
  }
}
