# Tasks: Config Page and Schedule View

**Input**: Design documents from `/specs/002-config-schedule-page/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contract.md ✅, quickstart.md ✅

**Tech Stack**: TypeScript ~6.0 · React 19 · React Router 7 · Tailwind CSS · styled-components 6 · date-fns 4 · Vite 8  
**Storage**: `localStorage` (subscribed teams, sim clock, TBA key, response cache) · `sessionStorage` (existing watch preferences — unchanged)

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label — US1, US2, or US3
- No test tasks — not explicitly requested in spec

---

## Phase 1: Setup

**Purpose**: Add shared TypeScript models and navigation link. No new npm dependencies required.

- [X] T001 Create all new TypeScript types (`SubscribedTeam`, `SimulationClock`, `TBAEvent`, `TBAMatchSimple`, `TBAAlliance`, `ScheduledMatchEntry`, `UnifiedSchedule`, `TeamScheduleStatus`, `TBAClientConfig`, `AppPersistentPreferences`) in `src/domain/models/schedule.ts`
- [X] T002 [P] Add Schedule navigation link to `src/components/layout/PageShell.tsx` so `/schedule` is reachable once the page exists

**Checkpoint**: Models are available for import; nav link is in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared `persistentPreferences` service that ALL three user stories depend on for cross-session settings storage.

**⚠️ CRITICAL**: US1, US2, and US3 UI work cannot begin until this phase is complete.

- [X] T003 Create `src/domain/services/persistentPreferences.ts` implementing:
  - `readPersistentPreferences(): AppPersistentPreferences` — reads and validates `rushhour.appPreferences.v1` from `localStorage`; returns safe defaults on missing/corrupt data
  - `writePersistentPreferences(update: Partial<AppPersistentPreferences>): AppPersistentPreferences` — merges update and persists
  - `getEffectiveTime(): Date` — returns `new Date(simulatedISOString)` when sim clock is enabled, otherwise `new Date()`
  - Schema version gate: returns defaults when `schemaVersion !== 'v1'`

**Checkpoint**: Foundation ready — US1, US2, and US3 can now begin

---

## Phase 3: User Story 1 — Configure Subscribed Teams (Priority: P1) 🎯 MVP

**Goal**: Users can add and remove teams on the Config page; subscriptions persist across sessions in `localStorage`.

**Independent Test**: Open `/config`, add team `254`, reload the page, confirm team `254` is still listed. Add duplicate `254`, confirm validation error appears. Remove team `254`, reload, confirm it's gone.

- [X] T004 [US1] Add Subscribed Teams section to `src/pages/ConfigPage/ConfigPage.tsx`:
  - Text input `data-testid="config-subscribed-team-input"` accepting 1–4 digit team numbers
  - Add button `data-testid="config-subscribed-team-add-btn"` — calls `writePersistentPreferences` on valid, non-duplicate input
  - Validation: reuse `/^\d{1,4}$/` pattern; block duplicates; show `data-testid="config-subscribed-team-validation-error"` on failure
  - List container `data-testid="config-subscribed-team-list"` rendering one row per subscribed team
  - Each row: `data-testid="config-subscribed-team-item"` with `data-testid="config-subscribed-team-remove-btn"` button that removes and persists
  - Reads from `persistentPreferences` on mount; syncs local state with `writePersistentPreferences` on every add/remove

**Checkpoint**: US1 fully functional and independently testable

---

## Phase 4: User Story 2 — Simulate Date and Time (Priority: P1)

**Goal**: Users can enable a simulation clock on the Config page with a chosen date/time; the setting persists across sessions and is consumed by the schedule page.

**Independent Test**: Open `/config`, enable simulation, set datetime to `2026-03-15T10:00`, save, reload the page, confirm simulation is still enabled with `2026-03-15T10:00`. Disable simulation, save, reload, confirm indicator shows "Using real time".

- [X] T005 [US2] Add Simulation Clock section to `src/pages/ConfigPage/ConfigPage.tsx`:
  - Toggle `data-testid="config-sim-clock-toggle"` (checkbox) — controls enabled state; when unchecked, hides datetime input and saves `{ enabled: false, simulatedISOString: null }`
  - Datetime input `data-testid="config-sim-clock-datetime-input"` (type `datetime-local`) — visible only when toggle is checked
  - Save button `data-testid="config-sim-clock-save-btn"` — calls `writePersistentPreferences({ simulationClock: { enabled: true, simulatedISOString: value } })`
  - Status indicator `data-testid="config-sim-clock-active-indicator"` — displays the active simulated datetime string when enabled, `"Using real time"` when disabled
  - Reads from `persistentPreferences` on mount to restore persisted state

**Checkpoint**: US2 fully functional; `getEffectiveTime()` now returns correct value for US3

---

## Phase 5: User Story 3 — View Unified Upcoming Schedule (Priority: P2)

**Goal**: Users can open `/schedule` and see one interleaved sorted list of upcoming matches for all subscribed teams, sourced from TBA, using the effective business time.

**Independent Test**: Set simulation clock to an active competition date (e.g., `2026-03-15`) with teams `254` and `1678` subscribed. Open `/schedule`. Confirm the list shows upcoming matches from both teams' active events, sorted by predicted time. Confirm `schedule-load-status` appears during load. Navigate with no subscribed teams — confirm setup guidance. Set an API key that fails — confirm `schedule-partial-data-banner`.

### Setup for User Story 3

- [X] T006 [US3] Add TBA API Key section to `src/pages/ConfigPage/ConfigPage.tsx`:
  - Password-type input `data-testid="config-tba-api-key-input"` for TBA read key
  - Save button `data-testid="config-tba-api-key-save-btn"` — calls `writePersistentPreferences({ tbaApiKey: value })`
  - Status element `data-testid="config-tba-api-key-status"` — displays `"Key configured"` when key is non-empty, `"No key set"` otherwise
  - Reads and restores key from `persistentPreferences` on mount (display masked/truncated for UX)

### Implementation for User Story 3

- [X] T007 [P] [US3] Create `src/domain/services/tbaClient.ts`:
  - `fetchJson<T>(path: string, apiKey: string): Promise<T>` — sends `GET https://www.thebluealliance.com/api/v3{path}` with `X-TBA-Auth-Key: {apiKey}` header
  - TTL cache: before fetching, read `rushhour.tbaCache.{encodedUrl}` from `localStorage`; return cached value if `cachedAt + 300_000 > Date.now()`; otherwise fetch, store `{ data, cachedAt }`, and return data
  - Throws typed `TBAFetchError` with `teamId` context on HTTP error or network failure
  - Exports: `fetchTeamEvents(teamId: string, year: number, apiKey: string): Promise<TBAEvent[]>` using `/team/frc{teamId}/events/{year}/simple`
  - Exports: `fetchEventMatches(eventKey: string, apiKey: string): Promise<TBAMatchSimple[]>` using `/event/{eventKey}/matches/simple`

- [X] T008 [P] [US3] Create `src/domain/services/scheduleBuilder.ts` (pure functions only — no DOM, no React):
  - `findActiveEvent(events: TBAEvent[], effectiveDate: string): TBAEvent | null` — returns the event where `effectiveDate >= start_date && effectiveDate <= end_date` (date-only string comparison; `YYYY-MM-DD`)
  - `filterUpcomingMatches(matches: TBAMatchSimple[], effectiveTimeUnix: number): TBAMatchSimple[]` — keeps matches where `predicted_time > effectiveTimeUnix && winning_alliance === null`; also includes matches where `predicted_time === null && winning_alliance === null`
  - `buildMatchLabel(match: TBAMatchSimple): string` — derives human label: `"Quals 12"`, `"Semis 1-2"`, `"Finals 1"`, etc.
  - `toScheduledMatchEntry(match: TBAMatchSimple, eventName: string, subscribedTeamIds: string[]): ScheduledMatchEntry` — maps raw TBA match to display type; sets `hasPredictedTime`, `isPlayed`, `subscribedTeamsInMatch`
  - `mergeAndSort(entries: ScheduledMatchEntry[]): ScheduledMatchEntry[]` — primary sort `predictedTime` ascending (nulls last); secondary sort by comp level order (`qm < ef < qf < sf < f`) then `match_number`

- [X] T009 [P] [US3] Create `src/components/schedule/ScheduleEntry.tsx`:
  - Props: `entry: ScheduledMatchEntry`
  - Root element: `data-testid="schedule-match-entry"`
  - Time cell: `data-testid="schedule-match-entry-time"` — formatted time (e.g., `"10:32 AM"`) or `"Time TBD"` when `hasPredictedTime` is false
  - Teams cell: `data-testid="schedule-match-entry-teams"` — lists all six team keys; highlights subscribed teams (from `subscribedTeamsInMatch`) with distinct styling
  - Shows `entry.eventName` and `entry.matchLabel`
  - Responsive: stacks time / label / teams vertically below 640px

- [X] T010 [P] [US3] Create `src/components/schedule/ScheduleEmptyState.tsx`:
  - Props: `variant: 'no-subscribed-teams' | 'no-active-events' | 'no-api-key'`
  - Root element: `data-testid="schedule-empty-state"`
  - `no-subscribed-teams`: message + link to `/config` directing user to add teams
  - `no-active-events`: message explaining no events are active at the current/simulated time; shows effective time for context
  - `no-api-key`: root element `data-testid="schedule-no-api-key-prompt"`; message + link to `/config` TBA key section

- [X] T011 [US3] Create `src/pages/SchedulePage/SchedulePage.tsx` and register `/schedule` route in `src/app/router.tsx`:
  - On mount: read `persistentPreferences`; if `tbaApiKey` is empty, render `<ScheduleEmptyState variant="no-api-key" />`; if `subscribedTeams` is empty, render `<ScheduleEmptyState variant="no-subscribed-teams" />`
  - Otherwise: show `data-testid="schedule-load-status"` spinner; call `fetchTeamEvents` for each subscribed team in parallel (`Promise.allSettled`); for each resolved result call `findActiveEvent`; for each active event call `fetchEventMatches`; build `UnifiedSchedule` via `toScheduledMatchEntry` + `filterUpcomingMatches` + `mergeAndSort`
  - Render `data-testid="schedule-effective-time-display"` showing effective time with simulation badge when active
  - Render `data-testid="schedule-match-list"` with `<ScheduleEntry>` per entry, or `<ScheduleEmptyState variant="no-active-events" />` when `entries.length === 0`
  - When any `TeamScheduleStatus.status === 'error'`, render `data-testid="schedule-partial-data-banner"` listing affected teams + `data-testid="schedule-team-status-list"`
  - Register lazy-loaded route: add `{ path: '/schedule', element: <SchedulePage /> }` to `src/app/router.tsx`

**Checkpoint**: All three user stories fully functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T012 Run `pnpm build` from repo root to confirm zero TypeScript compile errors across all new and modified files

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)        → no dependencies; start immediately
Phase 2 (Foundational) → depends on Phase 1 (needs schedule.ts types)
Phase 3 (US1 - P1)     → depends on Phase 2
Phase 4 (US2 - P1)     → depends on Phase 2
Phase 5 (US3 - P2)     → depends on Phase 2 (T006–T010 can start once T003 is done)
Phase 6 (Polish)       → depends on all phases complete
```

### User Story Dependencies

| Story | Phase | P1/P2 | Can start after | Depends on earlier stories? |
|-------|-------|-------|----------------|------------------------------|
| US1 – Subscribed Teams | 3 | P1 | Phase 2 complete | No |
| US2 – Simulation Clock | 4 | P1 | Phase 2 complete | No |
| US3 – Schedule Page | 5 | P2 | Phase 2 complete; US2 complete for `getEffectiveTime` | US2 provides effective time used by schedule |

> US3 integration works best after US2 is done so the sim clock can be tested against the schedule, but T007–T010 (services and components) can be built in parallel with US1/US2.

### Within User Story 3

```
T006 (TBA key UI)    → parallel to T007–T010
T007 (tbaClient)     → parallel to T008, T009, T010
T008 (scheduleBuilder) → parallel to T007, T009, T010
T009 (ScheduleEntry) → parallel to T007, T008, T010
T010 (ScheduleEmptyState) → parallel to T007, T008, T009
T011 (SchedulePage + route) → depends on T006, T007, T008, T009, T010
```

---

## Parallel Example: User Story 3

```bash
# After T003 (persistentPreferences) is complete:

# Terminal 1
implement T006  # TBA key section in ConfigPage.tsx

# Terminal 2
implement T007  # tbaClient.ts

# Terminal 3
implement T008  # scheduleBuilder.ts

# Terminal 4
implement T009  # ScheduleEntry.tsx

# Terminal 5
implement T010  # ScheduleEmptyState.tsx

# After all five complete:
implement T011  # SchedulePage.tsx + route registration
```

---

## Implementation Strategy

**MVP Scope (Phase 1 + 2 + 3 only)**: Subscribed teams can be added, removed, and persisted — enough to unblock schedule-page development with real data.

**Full delivery order**: P1 stories first (US1, US2) in parallel after Phase 2; then P2 story (US3) once `getEffectiveTime` is reliable.

**Testing approach**: Each story has a clear independent test described in its phase header — validate manually using the simulation clock to point at a known competition date.
