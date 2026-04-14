import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ConflictList } from '../../components/alerts/ConflictList'
import { UpcomingAlertsList } from '../../components/alerts/UpcomingAlertsList'
import { PageShell } from '../../components/layout/PageShell'
import { StatusCard } from '../../components/status/StatusCard'
import { WebcastPanel } from '../../components/stream/WebcastPanel'
import { WebcastSelector } from '../../components/stream/WebcastSelector'
import { computeConflictMatchKeys, toMatchConflicts } from '../../domain/services/scheduleBuilder'
import { deriveNextMatch, useWatchPageData } from '../../domain/services/watchPage'
import { getEffectiveTime, readPersistentPreferences } from '../../domain/services/persistentPreferences'
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
const HIGHER_PRIORITY_HOLD_SECONDS = 10 * 60

function formatTimeToMatch(predictedTime: number | null, effectiveUnix: number): string {
  if (predictedTime === null) return 'Time TBD'

  const diffSeconds = predictedTime - effectiveUnix
  if (diffSeconds <= 0) return 'In progress'

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
    return { status: 'in-progress', entry, minutesUntil: 0 }
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
): ScheduledMatchEntry | null {
  const candidates = entries.filter(
    (entry) => entry.subscribedTeamsInMatch.length > 0 && !entry.isPlayed,
  )

  if (candidates.length === 0) return null

  const current = currentShownMatchId
    ? candidates.find((entry) => entry.matchKey === currentShownMatchId) ?? null
    : null

  if (!current) {
    return candidates[0]
  }

  const currentPriority = getEntryPriority(current, teamPriorityById)
  const currentHoldUntil =
    current.predictedTime !== null ? current.predictedTime + HIGHER_PRIORITY_HOLD_SECONDS : null

  const upcomingWithinWindow = candidates.filter((entry) => {
    if (entry.matchKey === current.matchKey || entry.predictedTime === null) return false
    const secondsUntil = entry.predictedTime - effectiveUnix
    return secondsUntil >= 0 && secondsUntil <= AUTO_SWITCH_WINDOW_SECONDS
  })

  const higherPriorityWithinWindow = upcomingWithinWindow.find(
    (entry) => getEntryPriority(entry, teamPriorityById) < currentPriority,
  )

  if (higherPriorityWithinWindow) {
    return higherPriorityWithinWindow
  }

  const earliestWithinWindow = upcomingWithinWindow[0] ?? null
  if (!earliestWithinWindow) {
    return current
  }

  const earliestPriority = getEntryPriority(earliestWithinWindow, teamPriorityById)
  if (
    earliestPriority > currentPriority &&
    currentHoldUntil !== null &&
    effectiveUnix < currentHoldUntil
  ) {
    return current
  }

  return earliestWithinWindow
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
  const { loadStatus, schedule, webcasts, selectedWebcastId, noApiKey, noSubscribedTeams } =
    useWatchPageData()
  const [selectedQueuedMatchId, setSelectedQueuedMatchId] = useState<string | null>(null)
  const [autoShownMatchId, setAutoShownMatchId] = useState<string | null>(null)
  const [eventWebcastSelections, setEventWebcastSelections] = useState<Record<string, string>>(
    () => readEventWebcastSelections(),
  )

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
  const teamPriorityById = readPersistentPreferences().subscribedTeams.reduce<Record<string, number>>(
    (accumulator, team, index) => {
      accumulator[team.teamId] = index
      return accumulator
    },
    {},
  )
  const entries = schedule?.entries ?? []
  const queuedEntries = entries.slice(0, 3)
  const autoShownEntry = chooseAutoShownEntry(
    entries,
    effectiveUnix,
    autoShownMatchId,
    teamPriorityById,
  )

  useEffect(() => {
    setAutoShownMatchId(autoShownEntry?.matchKey ?? null)
  }, [autoShownEntry?.matchKey])

  useEffect(() => {
    if (selectedQueuedMatchId && !queuedEntries.some((entry) => entry.matchKey === selectedQueuedMatchId)) {
      setSelectedQueuedMatchId(null)
    }
  }, [queuedEntries, selectedQueuedMatchId])

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
      if (diffMin <= 0) return 'now' as const
      if (diffMin <= 15) return 'soon' as const
      return 'upcoming' as const
    })(),
    priorityScore: idx,
    label: entry.matchLabel,
  }))

  const conflictKeys = computeConflictMatchKeys(entries)
  const conflicts = toMatchConflicts(conflictKeys, entries)
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
  const visibleWebcasts = currentShownEntry
    ? webcasts.filter((w) => w.eventKey === currentShownEntry.eventKey)
    : []

  const currentEventKey = currentShownEntry?.eventKey ?? null
  const rememberedWebcastId = currentEventKey ? eventWebcastSelections[currentEventKey] : null
  const resolvedWebcastId = rememberedWebcastId ?? selectedWebcastId
  const activeWebcast =
    visibleWebcasts.find((w) => w.id === resolvedWebcastId) ?? visibleWebcasts[0] ?? null

  const streamOverlayInfo = currentShownEntry
    ? {
        matchLabel: `${currentShownEntry.matchLabel} - ${currentShownEntry.eventName}`,
        teams: currentShownEntry.subscribedTeamsInMatch,
        timeToMatch: formatTimeToMatch(currentShownEntry.predictedTime, effectiveUnix),
      }
    : null

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
