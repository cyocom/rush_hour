# Data Model: Config Page and Schedule View

> New entities introduced by this feature. Existing entities from feature 001 (`TrackedTeam`, `MatchWindow`, `UpcomingMatchAlert`, `MatchConflict`, `WatchSessionPreferences`) remain unchanged.

---

## Entity: SubscribedTeam

Represents a team the user has subscribed to for schedule tracking. Persisted across sessions.

| Field | Type | Notes |
|-------|------|-------|
| `teamId` | `string` | The team number as a string (e.g., `"254"`). TBA key: `frc{teamId}`. |
| `addedAt` | `string` | ISO 8601 timestamp when subscription was added. |

**Validation rules**:
- `teamId` must be a string of 1–4 digits matching `/^\d{1,4}$/`.
- Duplicate `teamId` values are rejected.
- Storage key: `rushhour.subscribedTeams.v1` in `localStorage`.

---

## Entity: SimulationClock

The user-controlled date/time override for business-logic time. Persisted across sessions.

| Field | Type | Notes |
|-------|------|-------|
| `enabled` | `boolean` | If `false`, the effective time is `Date.now()`. |
| `simulatedISOString` | `string \| null` | ISO 8601 datetime (e.g., `"2026-04-05T14:30:00"`). `null` when `enabled` is `false`. |

**Validation rules**:
- When `enabled` is `true`, `simulatedISOString` must be a parseable ISO datetime.
- Storage key: `rushhour.simulationClock.v1` in `localStorage`.

---

## Entity: TBAEvent (read-only, from TBA API)

Represents an event record from TBA's `/team/{team_key}/events/{year}/simple` response. Not persisted; fetched and cached with TTL.

| Field | Type | Notes |
|-------|------|-------|
| `key` | `string` | TBA event key (e.g., `"2026casj"`). |
| `name` | `string` | Human-readable event name. |
| `start_date` | `string` | `YYYY-MM-DD` format. |
| `end_date` | `string` | `YYYY-MM-DD` format. |
| `event_type` | `number` | TBA event type integer. |
| `city` | `string \| null` | |
| `state_prov` | `string \| null` | |

**Active event detection**: An event is "currently active" at `effectiveTime` when `effectiveDate >= start_date && effectiveDate <= end_date` (date-only, local date comparison).

---

## Entity: TBAMatchSimple (read-only, from TBA API)

Represents a simplified match from TBA's `/event/{event_key}/matches/simple` response. Not persisted; fetched and cached with TTL.

| Field | Type | Notes |
|-------|------|-------|
| `key` | `string` | TBA match key (e.g., `"2026casj_qm1"`). |
| `event_key` | `string` | Parent event key. |
| `comp_level` | `"qm" \| "ef" \| "qf" \| "sf" \| "f"` | Competition level. |
| `set_number` | `number` | Set number (relevant for elim). |
| `match_number` | `number` | Match number within the set/level. |
| `alliances` | `{ red: TBAAlliance; blue: TBAAlliance }` | |
| `time` | `number \| null` | Originally scheduled Unix timestamp. |
| `predicted_time` | `number \| null` | TBA predicted start Unix timestamp. Used for sorting. |
| `actual_time` | `number \| null` | Actual start time (if played). |
| `winning_alliance` | `string \| null` | Set after match is played. |

**Supporting type – TBAAlliance**:
| Field | Type | Notes |
|-------|------|-------|
| `team_keys` | `string[]` | TBA team keys (e.g., `["frc254", "frc1678", "frc4"]`). |
| `score` | `number \| null` | |

---

## Entity: ScheduledMatchEntry

A processed, display-ready match entry combining TBA data with subscription context. Not persisted; derived at runtime.

| Field | Type | Notes |
|-------|------|-------|
| `matchKey` | `string` | TBA match key. |
| `eventKey` | `string` | TBA event key. |
| `eventName` | `string` | Human-readable event name for display. |
| `compLevel` | `string` | Competition level label. |
| `matchLabel` | `string` | Derived display label, e.g., `"Quals 12"`, `"Semis 1-2"`. |
| `subscribedTeamsInMatch` | `string[]` | `teamId` values for subscribed teams in this match. |
| `predictedTime` | `number \| null` | Unix timestamp from `predicted_time`. |
| `hasPredictedTime` | `boolean` | `false` when `predicted_time` is null; triggers indicator. |
| `isPlayed` | `boolean` | `true` when `winning_alliance` is non-null. |

**Sorting rule**: Primary sort by `predictedTime` ascending (nulls last). Secondary sort by `comp_level` order (`qm` < `ef` < `qf` < `sf` < `f`) then `match_number`.

---

## Entity: UnifiedSchedule

The aggregated result presented on the Schedule page. Not persisted; computed on page load.

| Field | Type | Notes |
|-------|------|-------|
| `entries` | `ScheduledMatchEntry[]` | Sorted list of upcoming, unplayed matches. |
| `teamStatuses` | `TeamScheduleStatus[]` | Per-team fetch/active status for error display. |
| `effectiveTime` | `string` | ISO string of the effective business time used. |
| `isSimulated` | `boolean` | Whether simulation clock was active. |

---

## Entity: TeamScheduleStatus

Per-team metadata for the Schedule page's partial-data banner.

| Field | Type | Notes |
|-------|------|-------|
| `teamId` | `string` | |
| `status` | `"ok" \| "no-event" \| "error"` | `"no-event"` when no active event found at effective time; `"error"` on fetch failure. |
| `eventKey` | `string \| null` | Populated when `status === "ok"`. |
| `eventName` | `string \| null` | Populated when `status === "ok"`. |
| `errorMessage` | `string \| null` | Populated when `status === "error"`. |

---

## Entity: TBAClientConfig

Runtime configuration object used by the TBA API client. Not persisted directly—values are read from localStorage.

| Field | Type | Notes |
|-------|------|-------|
| `apiKey` | `string` | TBA read API key. Required for all requests. |
| `baseUrl` | `string` | Default: `"https://www.thebluealliance.com/api/v3"`. |
| `cacheTTLMs` | `number` | Default: `300_000` (5 minutes). |

---

## Entity: AppPersistentPreferences

Top-level structure for all localStorage-persisted app settings introduced in this feature.

| Field | Type | Notes |
|-------|------|-------|
| `subscribedTeams` | `SubscribedTeam[]` | |
| `simulationClock` | `SimulationClock` | |
| `tbaApiKey` | `string` | May be empty string if not yet configured. |
| `schemaVersion` | `string` | `"v1"` — gate for future migrations. |

**Storage key**: `rushhour.appPreferences.v1` in `localStorage`.

---

## State Transitions: SimulationClock

```text
[disabled]  --enable + set datetime-->  [enabled, simulatedISOString set]
[enabled]   --clear/disable-->           [disabled, simulatedISOString: null]
[enabled]   --update datetime-->         [enabled, simulatedISOString updated]
```

## State Transitions: SchedulePage Load

```text
[idle]  --page mount-->  [loading: fetching events for each subscribed team]
                           ↓ per team
                     [active event found]  -->  [loading: fetching matches]
                     [no active event]     -->  [TeamScheduleStatus: no-event]
                     [fetch error]         -->  [TeamScheduleStatus: error]
                           ↓ all settled
                     [filtering + merging upcoming matches]
                           ↓
                     [ready: UnifiedSchedule displayed]
                     [ready: empty state displayed if entries.length === 0]
```
