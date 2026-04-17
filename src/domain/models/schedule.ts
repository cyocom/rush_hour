// ─── Persistent preference types ───────────────────────────────────────────

export interface SubscribedTeam {
  teamId: string
  addedAt: string
}

export interface SimulationClock {
  enabled: boolean
  simulatedISOString: string | null
  running: boolean
  startedAtISOString: string | null
}

export interface AppPersistentPreferences {
  subscribedTeams: SubscribedTeam[]
  simulationClock: SimulationClock
  tbaApiKey: string
  schemaVersion: string
}

export const APP_PREFERENCES_SCHEMA_VERSION = 'v1'
export const APP_PREFERENCES_STORAGE_KEY = 'rushhour.appPreferences.v1'

export const DEFAULT_APP_PREFERENCES: AppPersistentPreferences = {
  subscribedTeams: [],
  simulationClock: {
    enabled: false,
    simulatedISOString: null,
    running: false,
    startedAtISOString: null,
  },
  tbaApiKey: '',
  schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
}

// ─── TBA API types (read-only, from TBA API v3) ─────────────────────────────

export interface TBAAlliance {
  team_keys: string[]
  score: number | null
}

export type TBACompLevel = 'qm' | 'ef' | 'qf' | 'sf' | 'f'

export interface TBAEvent {
  key: string
  name: string
  start_date: string
  end_date: string
  event_type: number
  city: string | null
  state_prov: string | null
}

export interface TBAMatchSimple {
  key: string
  event_key: string
  comp_level: TBACompLevel
  set_number: number
  match_number: number
  alliances: {
    red: TBAAlliance
    blue: TBAAlliance
  }
  time: number | null
  predicted_time: number | null
  actual_time: number | null
  winning_alliance: string | null
}

export interface TBAClientConfig {
  apiKey: string
  baseUrl: string
  cacheTTLMs: number
}

// ─── Schedule display types ──────────────────────────────────────────────────

export interface ScheduledMatchEntry {
  matchKey: string
  eventKey: string
  eventName: string
  compLevel: TBACompLevel
  matchLabel: string
  allTeamKeys: string[]
  subscribedTeamsInMatch: string[]
  subscribedTeamAlliances: Record<string, 'red' | 'blue'>
  predictedTime: number | null
  hasPredictedTime: boolean
  isPlayed: boolean
}

export type TeamScheduleStatusCode = 'ok' | 'no-event' | 'error'

export interface TeamScheduleStatus {
  teamId: string
  status: TeamScheduleStatusCode
  eventKey: string | null
  eventName: string | null
  errorMessage: string | null
}

export interface UnifiedSchedule {
  entries: ScheduledMatchEntry[]
  teamStatuses: TeamScheduleStatus[]
  effectiveTime: string
  isSimulated: boolean
}

// ─── Watch page types ────────────────────────────────────────────────────────

export interface TBAWebcast {
  type: string
  channel: string
  file?: string
}

export interface TBAEventDetail extends TBAEvent {
  webcasts: TBAWebcast[]
}

export type WebcastPlatform = 'twitch' | 'youtube' | 'unsupported'

export type StreamAvailability = 'online' | 'offline' | 'unknown'

export type AvailabilityProbeReason =
  | 'probe-success'
  | 'probe-timeout'
  | 'probe-error'
  | 'unsupported-provider'

export interface AvailabilityProbeResult {
  webcastId: string
  availability: StreamAvailability
  checkedAt: string
  reason: AvailabilityProbeReason
}

export type WebcastVisibilityMode = 'online-only' | 'fallback-show-all'

export interface VisibleWebcastSet {
  mode: WebcastVisibilityMode
  options: WebcastOption[]
  hasAnyOnline: boolean
  hasProbeFailures: boolean
}

export interface WebcastOption {
  id: string
  platform: WebcastPlatform
  channel: string
  eventKey: string
  eventName: string
  label: string
  embedUrl: string | null
  externalUrl: string
  availability: StreamAvailability
  availabilityCheckedAt: string | null
}

export type NextMatchStatus = 'upcoming' | 'soon' | 'in-progress' | 'none'

export interface NextMatchInfo {
  status: NextMatchStatus
  entry: ScheduledMatchEntry | null
  minutesUntil: number | null
}

export type WatchPageLoadStatus = 'idle' | 'loading' | 'done'

export interface WatchPageState {
  loadStatus: WatchPageLoadStatus
  schedule: UnifiedSchedule | null
  webcasts: WebcastOption[]
  selectedWebcastId: string | null
  hasStaleWebcastStatuses: boolean
  noApiKey: boolean
  noSubscribedTeams: boolean
  refreshWebcastAvailability: (eventWebcasts: WebcastOption[], preferredWebcastId?: string | null) => Promise<void>
}
