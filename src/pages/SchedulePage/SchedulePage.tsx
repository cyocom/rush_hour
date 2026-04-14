import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import styled from 'styled-components'
import { PageShell } from '../../components/layout/PageShell'
import { ScheduleEntry } from '../../components/schedule/ScheduleEntry'
import { ScheduleEmptyState } from '../../components/schedule/ScheduleEmptyState'
import { getEffectiveTime, readPersistentPreferences } from '../../domain/services/persistentPreferences'
import { fetchTeamEvents, fetchEventMatches } from '../../domain/services/tbaClient'
import {
  findActiveEvent,
  filterUpcomingMatches,
  toScheduledMatchEntry,
  mergeAndSort,
  computeConflictMatchKeys,
} from '../../domain/services/scheduleBuilder'
import type { ScheduledMatchEntry, TeamScheduleStatus, UnifiedSchedule } from '../../domain/models/schedule'

const CURRENT_SEASON_YEAR = new Date().getFullYear()

// ── Styled components ────────────────────────────────────────────────────────

const ContentWrapper = styled.div`
  margin-top: 24px;
  display: grid;
  gap: 16px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const EffectiveTimeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.04);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: rgb(255 255 255 / 0.78);
`;

const SimBadge = styled.span`
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(150 29 55), rgb(184 48 82));
  color: white;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 8px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: rgb(255 255 255 / 0.6);
  font-size: 15px;
  font-weight: 700;
`;

const Spinner = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgb(255 255 255 / 0.15);
  border-top-color: rgb(150 29 55);
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const MatchList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
`;

const DaySection = styled.section`
  display: grid;
  gap: 10px;
`;

const DayHeader = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 0;
  border-bottom: 1px solid rgb(255 255 255 / 0.1);

  &:hover span {
    color: rgb(255 255 255 / 0.75);
  }
`;

const DayLabel = styled.span`
  flex: 1;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.45);
  transition: color 0.15s;
`;

const DayCount = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: rgb(255 255 255 / 0.28);
  transition: color 0.15s;
`;

const DayChevron = styled.span<{ $collapsed: boolean }>`
  font-size: 9px;
  color: rgb(255 255 255 / 0.28);
  transition: transform 0.2s ease, color 0.15s;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  display: inline-block;
  line-height: 1;
`;

const PartialDataBanner = styled.div`
  border-radius: 16px;
  border: 1px solid rgb(255 184 0 / 0.3);
  background: rgb(255 184 0 / 0.07);
  padding: 14px 18px;
`;

const BannerTitle = styled.p`
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(255 184 0 / 0.9);
`;

const TeamStatusList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
`;

const TeamStatusItem = styled.li`
  font-size: 13px;
  color: rgb(255 255 255 / 0.68);
`;

// ── Component ────────────────────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'done'

export function SchedulePage() {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [schedule, setSchedule] = useState<UnifiedSchedule | null>(null)
  const [noApiKey, setNoApiKey] = useState(false)
  const [noSubscribedTeams, setNoSubscribedTeams] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const prefs = readPersistentPreferences()

    if (!prefs.tbaApiKey) {
      setNoApiKey(true)
      return
    }

    if (prefs.subscribedTeams.length === 0) {
      setNoSubscribedTeams(true)
      return
    }

    setLoadState('loading')

    const effectiveDate = getEffectiveTime()
    const effectiveDateStr = format(effectiveDate, 'yyyy-MM-dd')
    const effectiveUnix = Math.floor(effectiveDate.getTime() / 1000)
    const year = effectiveDate.getFullYear() || CURRENT_SEASON_YEAR

    if (import.meta.env.DEV) {
      console.group('[SchedulePage] Loading schedule')
      console.log('  effectiveDate  :', effectiveDateStr)
      console.log('  effectiveUnix  :', effectiveUnix, `(${effectiveDate.toISOString()})`)
      console.log('  season year    :', year)
      console.log('  simulated      :', readPersistentPreferences().simulationClock.enabled)
      console.log('  teams          :', readPersistentPreferences().subscribedTeams.map((t) => t.teamId))
      console.groupEnd()
    }

    async function loadSchedule() {
      const prefs = readPersistentPreferences()
      const apiKey = prefs.tbaApiKey
      const teams = prefs.subscribedTeams
      const subscribedTeamIds = teams.map((t) => t.teamId)
      const isSimulated = prefs.simulationClock.enabled && !!prefs.simulationClock.simulatedISOString

      // Fetch events for each team in parallel
      const eventResults = await Promise.allSettled(
        teams.map((team) => fetchTeamEvents(team.teamId, year, apiKey)),
      )

      const teamStatuses: TeamScheduleStatus[] = []
      const matchFetchTasks: Array<Promise<{ teamId: string; entries: ScheduledMatchEntry[] }>> = []

      eventResults.forEach((result, i) => {
        const teamId = teams[i].teamId

        if (result.status === 'rejected') {
          const err = result.reason
          if (import.meta.env.DEV) console.warn(`[SchedulePage] frc${teams[i].teamId}: event fetch FAILED —`, err)
          teamStatuses.push({
            teamId,
            status: 'error',
            eventKey: null,
            eventName: null,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          })
          return
        }

        const activeEvent = findActiveEvent(result.value, effectiveDateStr)

        if (!activeEvent) {
          if (import.meta.env.DEV) console.log(`[SchedulePage] frc${teams[i].teamId}: no active event at ${effectiveDateStr} (${result.value.length} events fetched)`)
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

        matchFetchTasks.push(
          fetchEventMatches(activeEvent.key, apiKey).then((matches) => {
            const upcoming = filterUpcomingMatches(matches, effectiveUnix, isSimulated)
            const entries = upcoming.map((m) =>
              toScheduledMatchEntry(m, activeEvent.name, subscribedTeamIds),
            )
            return { teamId, entries }
          }),
        )
      })

      // Fetch matches for all active events in parallel
      const matchResults = await Promise.allSettled(matchFetchTasks)

      const allEntries: ScheduledMatchEntry[] = []
      matchResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          // Find the team status for this task and mark it as error
          const taskTeamId = teamStatuses.find((s) => s.status === 'ok')
          if (taskTeamId) {
            const idx = teamStatuses.findIndex(
              (s, si) =>
                s.status === 'ok' &&
                teamStatuses.slice(0, si).filter((ts) => ts.status === 'ok').length === i,
            )
            if (idx !== -1) {
              teamStatuses[idx] = {
                ...teamStatuses[idx],
                status: 'error',
                errorMessage:
                  result.reason instanceof Error ? result.reason.message : 'Failed to load matches',
              }
            }
          }
          return
        }
        allEntries.push(...result.value.entries)
      })

      // Deduplicate by matchKey (same match may appear for multiple subscribed teams)
      const seen = new Set<string>()
      const deduped: ScheduledMatchEntry[] = []
      for (const entry of allEntries) {
        if (!seen.has(entry.matchKey)) {
          seen.add(entry.matchKey)
          deduped.push(entry)
        } else {
          // Merge subscribedTeamsInMatch for duplicate match entries
          const existing = deduped.find((e) => e.matchKey === entry.matchKey)
          if (existing) {
            const merged = new Set([...existing.subscribedTeamsInMatch, ...entry.subscribedTeamsInMatch])
            existing.subscribedTeamsInMatch = [...merged]
            existing.subscribedTeamAlliances = { ...entry.subscribedTeamAlliances, ...existing.subscribedTeamAlliances }
          }
        }
      }

      const withSubscribed = deduped.filter((e) => e.subscribedTeamsInMatch.length > 0)
      const sorted = mergeAndSort(withSubscribed)

      setSchedule({
        entries: sorted,
        teamStatuses,
        effectiveTime: effectiveDate.toISOString(),
        isSimulated,
      })
      setLoadState('done')
    }

    loadSchedule().catch(() => setLoadState('done'))
  }, [])

  // Collapse all days beyond the effective day when schedule first loads
  useEffect(() => {
    if (!schedule) return
    const effectiveDateStr = format(new Date(schedule.effectiveTime), 'yyyy-MM-dd')
    const futureDays = new Set<string>()
    for (const entry of schedule.entries) {
      if (entry.predictedTime !== null) {
        const d = format(new Date(entry.predictedTime * 1000), 'yyyy-MM-dd')
        if (d > effectiveDateStr) futureDays.add(d)
      }
    }
    setCollapsed(futureDays)
  }, [schedule])

  // ── Early exits ───────────────────────────────────────────────────────────

  if (noApiKey) {
    return (
      <PageShell title="Schedule" subtitle="Upcoming matches for your subscribed teams.">
        <ScheduleEmptyState variant="no-api-key" />
      </PageShell>
    )
  }

  if (noSubscribedTeams) {
    return (
      <PageShell title="Schedule" subtitle="Upcoming matches for your subscribed teams.">
        <ScheduleEmptyState variant="no-subscribed-teams" />
      </PageShell>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <PageShell title="Schedule" subtitle="Upcoming matches for your subscribed teams.">
        <LoadingIndicator data-testid="schedule-load-status">
          <Spinner />
          Loading schedule…
        </LoadingIndicator>
      </PageShell>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (!schedule) {
    return (
      <PageShell title="Schedule" subtitle="Upcoming matches for your subscribed teams.">
        <ScheduleEmptyState variant="no-active-events" />
      </PageShell>
    )
  }

  const effectiveTimeDisplay = format(new Date(schedule.effectiveTime), 'MMM d, yyyy h:mm a')
  const hasErrors = schedule.teamStatuses.some((s) => s.status === 'error')
  const conflictMatchKeys = computeConflictMatchKeys(schedule.entries)

  return (
    <PageShell
      title="Schedule"
      subtitle="Upcoming matches for your subscribed teams."
    >
      <ContentWrapper data-testid="schedule-page-root">
        <TopBar>
          <EffectiveTimeDisplay data-testid="schedule-effective-time-display">
            {schedule.isSimulated && <SimBadge>Sim</SimBadge>}
            {effectiveTimeDisplay}
          </EffectiveTimeDisplay>
        </TopBar>

        {hasErrors && (
          <PartialDataBanner data-testid="schedule-partial-data-banner">
            <BannerTitle>Partial data — some teams unavailable</BannerTitle>
            <TeamStatusList data-testid="schedule-team-status-list">
              {schedule.teamStatuses
                .filter((s) => s.status === 'error')
                .map((s) => (
                  <TeamStatusItem key={s.teamId}>
                    Team {s.teamId}: {s.errorMessage ?? 'Failed to load'}
                  </TeamStatusItem>
                ))}
            </TeamStatusList>
          </PartialDataBanner>
        )}

        {schedule.entries.length === 0 ? (
          <ScheduleEmptyState
            variant="no-active-events"
            effectiveTimeDisplay={effectiveTimeDisplay}
          />
        ) : (
          <DayGroupedSchedule
            entries={schedule.entries}
            effectiveDateStr={format(new Date(schedule.effectiveTime), 'yyyy-MM-dd')}
            conflictMatchKeys={conflictMatchKeys}
            collapsed={collapsed}
            onToggle={(dateStr) =>
              setCollapsed((prev) => {
                const next = new Set(prev)
                next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr)
                return next
              })
            }
          />
        )}
      </ContentWrapper>
    </PageShell>
  )
}

// ── Day-grouped match list ────────────────────────────────────────────────────

interface DayBucket {
  dateStr: string
  label: string
  entries: ScheduledMatchEntry[]
}

interface DayGroupedScheduleProps {
  entries: ScheduledMatchEntry[]
  effectiveDateStr: string
  conflictMatchKeys: Set<string>
  collapsed: Set<string>
  onToggle: (dateStr: string) => void
}

function DayGroupedSchedule({ entries, effectiveDateStr, conflictMatchKeys, collapsed, onToggle }: DayGroupedScheduleProps) {
  const buckets: DayBucket[] = []
  const bucketMap = new Map<string, DayBucket>()

  for (const entry of entries) {
    let dateStr: string
    let label: string
    if (entry.predictedTime !== null) {
      const d = new Date(entry.predictedTime * 1000)
      dateStr = format(d, 'yyyy-MM-dd')
      const isToday = dateStr === effectiveDateStr
      label = isToday ? `Today · ${format(d, 'EEEE, MMM d')}` : format(d, 'EEEE, MMM d')
    } else {
      dateStr = 'tbd'
      label = 'Time TBD'
    }
    if (!bucketMap.has(dateStr)) {
      const bucket: DayBucket = { dateStr, label, entries: [] }
      buckets.push(bucket)
      bucketMap.set(dateStr, bucket)
    }
    bucketMap.get(dateStr)!.entries.push(entry)
  }

  return (
    <>
      {buckets.map((bucket) => {
        const isCollapsed = collapsed.has(bucket.dateStr)
        return (
          <DaySection key={bucket.dateStr}>
            <DayHeader onClick={() => onToggle(bucket.dateStr)} aria-expanded={!isCollapsed}>
              <DayLabel>{bucket.label}</DayLabel>
              <DayCount>{bucket.entries.length} match{bucket.entries.length !== 1 ? 'es' : ''}</DayCount>
              <DayChevron $collapsed={isCollapsed}>▼</DayChevron>
            </DayHeader>
            {!isCollapsed && (
              <MatchList>
                {bucket.entries.map((entry) => (
                  <ScheduleEntry
                    key={entry.matchKey}
                    entry={entry}
                    hasTimeConflict={conflictMatchKeys.has(entry.matchKey)}
                  />
                ))}
              </MatchList>
            )}
          </DaySection>
        )
      })}
    </>
  )
}
