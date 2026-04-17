import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ConflictList } from '../../components/alerts/ConflictList'
import { UpcomingAlertsList } from '../../components/alerts/UpcomingAlertsList'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { WebcastPanel } from '../../components/stream/WebcastPanel'
import { WebcastSelector } from '../../components/stream/WebcastSelector'
import { computeConflictMatchKeys, toMatchConflicts } from '../../domain/services/scheduleBuilder'
import { deriveNextMatch, deriveVisibleWebcastSet, useWatchPageData } from '../../domain/services/watchPage'
import { getEffectiveTime } from '../../domain/services/persistentPreferences'
import { useWatchPreferences } from '../../app/watchPreferencesContext'
import type { UpcomingMatchAlert } from '../../domain/models/watch'
import type { NextMatchInfo, ScheduledMatchEntry } from '../../domain/models/schedule'

const Spinner = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgb(255 255 255 / 0.15);
  border-top-color: rgb(150 29 55);
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
  color: white;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 18px 30px rgb(150 29 55 / 0.2);
`

const AUTO_SWITCH_WINDOW_SECONDS = 5 * 60
const MIN_STICKY_AFTER_START_SECONDS = 5 * 60
const HIGHER_PRIORITY_HOLD_SECONDS = 10 * 60

type AutoSwitchReason =
  | 'no-candidates'
  | 'initial-pick'
  | 'sticky-after-start-guard'
  | 'awaiting-score-post'
  | 'higher-priority-within-window'
  | 'no-upcoming-within-window'
  | 'lower-priority-blocked-by-hold'
  | 'switch-to-earliest-within-window'

interface AutoSwitchDecision {
  entry: ScheduledMatchEntry | null
  reason: AutoSwitchReason
  trace: string[]
}

function formatTimeToMatch(predictedTime: number | null, effectiveUnix: number): string {
  if (predictedTime === null) return 'Time TBD'

  const diffSeconds = predictedTime - effectiveUnix
  if (diffSeconds <= 0) return 'Upcoming'

  const totalMinutes = Math.ceil(diffSeconds / 60)
  if (totalMinutes < 60) return `Starts in ${totalMinutes}m`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `Starts in ${hours}h` : `Starts in ${hours}h ${minutes}m`
}

function toNextMatchInfo(entry: ScheduledMatchEntry, effectiveUnix: number): NextMatchInfo {
  if (entry.predictedTime === null) {
    return { status: 'upcoming', entry, minutesUntil: null }
  }

  const diffSeconds = entry.predictedTime - effectiveUnix
  const minutesUntil = Math.max(0, Math.floor(diffSeconds / 60))

  if (diffSeconds <= 0 && !entry.isPlayed) {
    return { status: 'upcoming', entry, minutesUntil: 0 }
  }

  return {
    status: diffSeconds <= 600 ? 'soon' : 'upcoming',
    entry,
    minutesUntil,
  }
}

function getEntryPriority(
  entry: ScheduledMatchEntry,
  teamPriorityById: Record<string, number>,
): number {
  const ranks = entry.subscribedTeamsInMatch
    .map((teamId) => teamPriorityById[teamId] ?? Number.POSITIVE_INFINITY)
    .filter((rank) => Number.isFinite(rank))

  return ranks.length > 0 ? Math.min(...ranks) : Number.POSITIVE_INFINITY
}

function chooseAutoShownEntry(
  entries: ScheduledMatchEntry[],
  effectiveUnix: number,
  currentShownMatchId: string | null,
  teamPriorityById: Record<string, number>,
): AutoSwitchDecision {
  const trace: string[] = []
  const candidates = entries.filter(
    (entry) => entry.subscribedTeamsInMatch.length > 0 && !entry.isPlayed,
  )
  trace.push(`candidates=${candidates.length}`)

  if (candidates.length === 0) {
    trace.push('exit:no-candidates')
    return { entry: null, reason: 'no-candidates', trace }
  }

  const current = currentShownMatchId
    ? candidates.find((entry) => entry.matchKey === currentShownMatchId) ?? null
    : null
  trace.push(`currentShownMatchId=${currentShownMatchId ?? 'null'}`)
  trace.push(`currentCandidate=${current?.matchKey ?? 'null'}`)

  if (!current) {
    trace.push(`initial-pick=${candidates[0].matchKey}`)
    return { entry: candidates[0], reason: 'initial-pick', trace }
  }

  const currentPriority = getEntryPriority(current, teamPriorityById)
  const stickyUntil =
    current.predictedTime !== null ? current.predictedTime + MIN_STICKY_AFTER_START_SECONDS : null
  const currentHoldUntil =
    current.predictedTime !== null ? current.predictedTime + HIGHER_PRIORITY_HOLD_SECONDS : null
  trace.push(`currentPriority=${currentPriority}`)
  trace.push(`currentPredictedTime=${current.predictedTime ?? 'null'}`)
  trace.push(`stickyUntil=${stickyUntil ?? 'null'}`)
  trace.push(`currentHoldUntil=${currentHoldUntil ?? 'null'}`)

  if (stickyUntil !== null && effectiveUnix < stickyUntil) {
    trace.push(`sticky-guard-hit effectiveUnix=${effectiveUnix}`)
    return { entry: current, reason: 'sticky-after-start-guard', trace }
  }

  // After match start, keep the stream on the current match until TBA
  // reports it as played (scores/results posted).
  if (current.predictedTime !== null && effectiveUnix >= current.predictedTime) {
    trace.push(`awaiting-score-post effectiveUnix=${effectiveUnix}`)
    return { entry: current, reason: 'awaiting-score-post', trace }
  }

  const upcomingWithinWindow = candidates.filter((entry) => {
    if (entry.matchKey === current.matchKey || entry.predictedTime === null) return false
    const secondsUntil = entry.predictedTime - effectiveUnix
    return secondsUntil >= 0 && secondsUntil <= AUTO_SWITCH_WINDOW_SECONDS
  })
  trace.push(
    `upcomingWithinWindow=${upcomingWithinWindow
      .map((entry) => `${entry.matchKey}(p=${getEntryPriority(entry, teamPriorityById)})`)
      .join(',') || 'none'}`,
  )

  const higherPriorityWithinWindow = upcomingWithinWindow.find(
    (entry) => getEntryPriority(entry, teamPriorityById) < currentPriority,
  )

  if (higherPriorityWithinWindow) {
    trace.push(`higher-priority-hit=${higherPriorityWithinWindow.matchKey}`)
    return { entry: higherPriorityWithinWindow, reason: 'higher-priority-within-window', trace }
  }

  const earliestWithinWindow = upcomingWithinWindow[0] ?? null
  if (!earliestWithinWindow) {
    trace.push('exit:no-upcoming-within-window')
    return { entry: current, reason: 'no-upcoming-within-window', trace }
  }

  const earliestPriority = getEntryPriority(earliestWithinWindow, teamPriorityById)
  trace.push(`earliestWithinWindow=${earliestWithinWindow.matchKey}`)
  trace.push(`earliestPriority=${earliestPriority}`)
  if (
    earliestPriority > currentPriority &&
    currentHoldUntil !== null &&
    effectiveUnix < currentHoldUntil
  ) {
    trace.push('exit:lower-priority-blocked-by-hold')
    return { entry: current, reason: 'lower-priority-blocked-by-hold', trace }
  }

  trace.push('exit:switch-to-earliest-within-window')
  return { entry: earliestWithinWindow, reason: 'switch-to-earliest-within-window', trace }
}

const WATCH_EVENT_SELECTIONS_STORAGE_KEY = 'rushhour.watch.eventWebcastSelections.v1'

function readEventWebcastSelections(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(WATCH_EVENT_SELECTIONS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function WatchPage() {
  const { trackedTeams } = useWatchPreferences()
  const {
    loadStatus,
    schedule,
    webcasts,
    selectedWebcastId,
    hasStaleWebcastStatuses,
    noApiKey,
    noSubscribedTeams,
    refreshWebcastAvailability,
  } = useWatchPageData()
  const [, setClockTick] = useState(0)
  const [selectedQueuedMatchId, setSelectedQueuedMatchId] = useState<string | null>(null)
  const [autoShownMatchId, setAutoShownMatchId] = useState<string | null>(null)
  const [webcastStatusMessage, setWebcastStatusMessage] = useState<string | null>(null)
  const [eventWebcastSelections, setEventWebcastSelections] = useState<Record<string, string>>(
    () => readEventWebcastSelections(),
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockTick((tick) => tick + 1)
    }, 15_000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        WATCH_EVENT_SELECTIONS_STORAGE_KEY,
        JSON.stringify(eventWebcastSelections),
      )
    } catch {
      // Ignore storage write failures (e.g. private mode quotas)
    }
  }, [eventWebcastSelections])

  const effectiveDate = getEffectiveTime()
  const effectiveUnix = Math.floor(effectiveDate.getTime() / 1000)
  const teamPriorityById = trackedTeams.reduce<Record<string, number>>(
    (accumulator, team, index) => {
      accumulator[team.teamId] = index
      return accumulator
    },
    {},
  )
  const entries = schedule?.entries ?? []
  const queuedEntries = entries.slice(0, 3)
  const autoSwitchDecision = chooseAutoShownEntry(
    entries,
    effectiveUnix,
    autoShownMatchId,
    teamPriorityById,
  )
  const autoShownEntry = autoSwitchDecision.entry
  const previousAutoShownMatchIdRef = useRef<string | null>(null)
  const previousActiveWebcastIdRef = useRef<string | null>(null)
  const autoShownMatchKey = autoShownEntry?.matchKey ?? null

  useEffect(() => {
    const previous = previousAutoShownMatchIdRef.current
    const next = autoShownMatchKey

    // Always log decision at verbose level
    console.debug('[WatchPage][verbose] Auto stream decision', {
      reason: autoSwitchDecision.reason,
      from: previous,
      to: next,
      effectiveUnix,
      trace: autoSwitchDecision.trace,
      queue: queuedEntries.map((entry) => ({
        key: entry.matchKey,
        event: entry.eventKey,
        predictedTime: entry.predictedTime,
        isPlayed: entry.isPlayed,
        teams: entry.subscribedTeamsInMatch,
      })),
    })

    // Log warning when match actually changes
    if (previous !== next) {
      console.warn('[WatchPage] Stream switched', {
        reason: autoSwitchDecision.reason,
        from: previous,
        to: next,
      })
    }

    previousAutoShownMatchIdRef.current = autoShownMatchKey
    setAutoShownMatchId(autoShownMatchKey)
  }, [
    autoShownMatchKey,
    autoSwitchDecision.reason,
    effectiveUnix,
    queuedEntries,
  ])

  useEffect(() => {
    if (selectedQueuedMatchId && !queuedEntries.some((entry) => entry.matchKey === selectedQueuedMatchId)) {
      if (import.meta.env.DEV) {
        console.log('[WatchPage] Clearing manual selection; match no longer in queue:', selectedQueuedMatchId)
      }
      setSelectedQueuedMatchId(null)
    }
  }, [queuedEntries, selectedQueuedMatchId])

  const hasActiveEvents = (schedule?.teamStatuses ?? []).some((s) => s.status === 'ok')
  const hasErrors = (schedule?.teamStatuses ?? []).some((s) => s.status === 'error')

  const alerts: UpcomingMatchAlert[] = entries.map((entry, idx) => ({
    alertId: `alert-${entry.matchKey}`,
    matchId: entry.matchKey,
    eventName: entry.eventName,
    trackedTeamsInMatch: entry.subscribedTeamsInMatch,
    allTeamKeys: entry.allTeamKeys,
    subscribedTeamAlliances: entry.subscribedTeamAlliances,
    startTime: entry.predictedTime !== null
      ? new Date(entry.predictedTime * 1000).toISOString()
      : new Date(Date.now() + (idx + 1) * 60000).toISOString(),
    endTime: entry.predictedTime !== null
      ? new Date((entry.predictedTime + 600) * 1000).toISOString()
      : new Date(Date.now() + (idx + 1) * 60000 + 600000).toISOString(),
    urgency: (() => {
      if (!entry.predictedTime) return 'upcoming' as const
      const diffMin = Math.floor((entry.predictedTime - effectiveUnix) / 60)
      if (diffMin <= 0) return 'upcoming' as const
      if (diffMin <= 15) return 'soon' as const
      return 'upcoming' as const
    })(),
    priorityScore: idx,
    label: entry.matchLabel,
  }))

  const conflictKeys = computeConflictMatchKeys(entries)
  const conflicts = toMatchConflicts(conflictKeys, entries, teamPriorityById)
  const nextThreeMatchKeys = new Set(entries.slice(0, 3).map((entry) => entry.matchKey))
  const visibleConflicts = conflicts.filter((conflict) =>
    conflict.impactedMatchIds.some((matchId) => nextThreeMatchKeys.has(matchId)),
  )
  const nextMatch = deriveNextMatch(entries, effectiveUnix)
  const selectedQueuedEntry = queuedEntries.find((entry) => entry.matchKey === selectedQueuedMatchId) ?? null
  const activeNextMatch = selectedQueuedEntry
    ? toNextMatchInfo(selectedQueuedEntry, effectiveUnix)
    : autoShownEntry
    ? toNextMatchInfo(autoShownEntry, effectiveUnix)
    : nextMatch

  // Scope webcast pills to only the event for the match currently shown.
  const currentShownEntry = activeNextMatch.entry ?? entries[0] ?? null
  const eventScopedWebcasts = currentShownEntry
    ? webcasts.filter((w) => w.eventKey === currentShownEntry.eventKey)
    : []
  const visibleWebcastSet = deriveVisibleWebcastSet(eventScopedWebcasts)
  const visibleWebcasts = visibleWebcastSet.options

  const currentEventKey = currentShownEntry?.eventKey ?? null
  const rememberedWebcastId = currentEventKey ? eventWebcastSelections[currentEventKey] : null
  const resolvedWebcastId = rememberedWebcastId ?? selectedWebcastId
  const activeWebcast =
    visibleWebcasts.find((w) => w.id === resolvedWebcastId) ?? visibleWebcasts[0] ?? null

  useEffect(() => {
    if (!currentEventKey || !resolvedWebcastId) {
      setWebcastStatusMessage(null)
      return
    }

    const isStillVisible = visibleWebcasts.some((webcast) => webcast.id === resolvedWebcastId)
    if (isStillVisible) {
      setWebcastStatusMessage(null)
      return
    }

    const existedBeforeFilter = eventScopedWebcasts.some((webcast) => webcast.id === resolvedWebcastId)
    if (!existedBeforeFilter) {
      setWebcastStatusMessage(null)
      return
    }

    if (visibleWebcastSet.mode === 'online-only') {
      setWebcastStatusMessage('Your previously selected stream is no longer live. Switched to an available stream.')
    }
  }, [
    currentEventKey,
    eventScopedWebcasts,
    resolvedWebcastId,
    visibleWebcastSet.mode,
    visibleWebcasts,
  ])

  useEffect(() => {
    if (!currentEventKey || !activeWebcast) return

    setEventWebcastSelections((previous) => {
      if (previous[currentEventKey] === activeWebcast.id) {
        return previous
      }
      return {
        ...previous,
        [currentEventKey]: activeWebcast.id,
      }
    })
  }, [activeWebcast, currentEventKey])

  useEffect(() => {
    if (!currentEventKey || !activeWebcast) return

    const previousActiveWebcastId = previousActiveWebcastIdRef.current
    previousActiveWebcastIdRef.current = activeWebcast.id

    const didSwitchWebcast =
      previousActiveWebcastId !== null && previousActiveWebcastId !== activeWebcast.id

    if (!didSwitchWebcast) return

    const hasUncheckedYoutubeWebcasts = eventScopedWebcasts.some(
      (webcast) => webcast.platform === 'youtube' && webcast.availabilityCheckedAt === null,
    )

    if (!hasUncheckedYoutubeWebcasts) return

    refreshWebcastAvailability(eventScopedWebcasts, activeWebcast.id).catch(() => {
      // The hook records stale status; nothing else to do in the page.
    })
  }, [activeWebcast, currentEventKey, eventScopedWebcasts, refreshWebcastAvailability])

  const streamOverlayInfo = currentShownEntry
    ? {
        matchLabel: `${currentShownEntry.matchLabel} - ${currentShownEntry.eventName}`,
        teams: currentShownEntry.subscribedTeamsInMatch,
        timeToMatch: formatTimeToMatch(currentShownEntry.predictedTime, effectiveUnix),
      }
    : null

  if (noApiKey) {
    return (
      <PageShell
        title="Watch"
        subtitle="Track upcoming matches for your subscribed teams and catch overlap conflicts early."
        immersive
      >
        <div className="mt-6">
          <StatusCard
            title="API key not configured"
            body="Add your TBA API key on the Config page to load live event data."
            action={<ActionLink to="/config">Go to Config</ActionLink>}
          />
        </div>
      </PageShell>
    )
  }

  if (noSubscribedTeams) {
    return (
      <PageShell
        title="Watch"
        subtitle="Track upcoming matches for your subscribed teams and catch overlap conflicts early."
        immersive
      >
        <div className="mt-6">
          <StatusCard
            title="No teams configured"
            body="Subscribe to at least one team on the Config page to see live schedule data here."
            action={<ActionLink to="/config">Go to Config</ActionLink>}
          />
        </div>
      </PageShell>
    )
  }

  if (loadStatus === 'idle' || loadStatus === 'loading') {
    return (
      <PageShell
        title="Watch"
        subtitle="Track upcoming matches for your subscribed teams and catch overlap conflicts early."
        immersive
      >
        <div className="mt-6 flex items-center justify-center gap-3 py-16 text-sm font-bold text-white/60">
          <Spinner />
          Loading live data…
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Watch"
      subtitle="Track upcoming matches for your subscribed teams and catch overlap conflicts early."
      immersive
    >
      <div className="mt-6 grid gap-5">
        {hasErrors && (
          <div
            data-testid="watch-partial-data-banner"
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.1em] text-amber-400/90">
              Partial data — some teams unavailable
            </p>
            <ul className="mt-2 grid gap-1">
              {schedule?.teamStatuses
                .filter((s) => s.status === 'error')
                .map((s) => (
                  <li key={s.teamId} className="text-sm text-white/65">
                    Team {s.teamId}: {s.errorMessage ?? 'Failed to load'}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3">
          <WebcastSelector
            webcasts={visibleWebcasts}
            selectedId={activeWebcast?.id ?? resolvedWebcastId}
            mode={visibleWebcastSet.mode}
            onSelect={(id) => {
              if (!currentEventKey) return
              setEventWebcastSelections((prev) => ({
                ...prev,
                [currentEventKey]: id,
              }))
            }}
          />
          <WebcastPanel
            webcast={activeWebcast}
            hasActiveEvents={hasActiveEvents}
            overlayInfo={streamOverlayInfo}
            showOfflineFallbackMessage={
              visibleWebcastSet.mode === 'fallback-show-all' && eventScopedWebcasts.length > 0
            }
            showStaleStatusWarning={hasStaleWebcastStatuses || visibleWebcastSet.hasProbeFailures}
            statusChangeMessage={webcastStatusMessage}
          />
        </div>

        {visibleConflicts.length > 0 && <ConflictList conflicts={visibleConflicts} />}
        {alerts.length > 0 && (
          <UpcomingAlertsList
            alerts={alerts}
            referenceTime={effectiveDate}
            selectedMatchId={currentShownEntry?.matchKey ?? null}
            onSelectMatch={(matchId) => setSelectedQueuedMatchId(matchId)}
          />
        )}

        {!hasActiveEvents && (
          <StatusCard
            title="No active events"
            body="None of your subscribed teams have an event running at the current effective time. Try adjusting the simulation clock in Config."
            action={<ActionLink to="/config">Go to Config</ActionLink>}
          />
        )}
        {hasActiveEvents && alerts.length === 0 && (
          <StatusCard
            title="No upcoming tracked matches"
            body="Your teams have an active event, but no upcoming matches were found at the current effective time."
          />
        )}
      </div>
    </PageShell>
  )
}
