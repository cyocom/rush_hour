# Tasks: Watch Page Live Integration

**Input**: Design documents from `/specs/003-watch-page-integration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contract.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Add new types and extend the TBA client — foundational plumbing that all user stories depend on.

- [X] T001 Add `TBAWebcast`, `TBAEventDetail`, `WebcastOption`, `WebcastPlatform`, `NextMatchInfo`, `NextMatchStatus`, `WatchPageLoadStatus`, `WatchPageState` types to `src/domain/models/schedule.ts` per data-model.md
- [X] T002 Add `fetchEventDetail(eventKey, apiKey)` to `src/domain/services/tbaClient.ts` calling `/event/{eventKey}` and returning `TBAEventDetail`

**Checkpoint**: Type definitions and TBA client extended — all downstream tasks can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core pure functions and the shared `useWatchPageData` hook — must be complete before any UI work.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete

- [X] T003 Create `src/domain/services/watchPage.ts` with pure function `deriveNextMatch(entries, effectiveUnix): NextMatchInfo` per data-model.md derivation rules (depends on T001)
- [X] T004 [P] Add pure function `buildWebcastOptions(eventDetails, hostname): WebcastOption[]` to `src/domain/services/watchPage.ts` implementing deduplication, embedUrl/externalUrl construction, and label format per data-model.md (depends on T001)
- [X] T005 Move `computeConflictMatchKeys` from `src/pages/SchedulePage/SchedulePage.tsx` into `src/domain/services/scheduleBuilder.ts` as an exported function; update SchedulePage import (depends on T001)
- [X] T006 Add `toMatchConflicts(conflictKeys: Set<string>, entries: ScheduledMatchEntry[]): MatchConflict[]` adapter to `src/domain/services/scheduleBuilder.ts` to bridge `ScheduledMatchEntry`-based conflict data to the existing `MatchConflict` model (depends on T005)
- [X] T007 Implement `useWatchPageData(): WatchPageState` hook in `src/domain/services/watchPage.ts` — reads prefs, fetches events + matches + event details in parallel, builds `UnifiedSchedule`, `WebcastOption[]`, and `selectedWebcastId`; handles `noApiKey`/`noSubscribedTeams` early exits and partial failures (depends on T002, T003, T004, T006)

**Checkpoint**: Foundation ready — all four user story UI phases can now be implemented

---

## Phase 3: User Story 1 — Live Webcast Display (Priority: P1) 🎯 MVP

**Goal**: Replace `MockStreamPanel` with a live TBA-sourced webcast embed (`WebcastPanel`) and a `WebcastSelector` pill toggle row. All four panel states (embed, no-webcast, no-event, unsupported-platform) must render correctly.

**Independent Test**: With a subscribed team whose event has a registered webcast (use simulation clock to target a past event date), navigate to `/watch` and confirm the Twitch or YouTube embed appears. With no webcasts registered, confirm the fallback link state renders.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `src/components/stream/WebcastPanel.tsx` implementing all four states (Twitch embed, YouTube embed, no-webcast fallback, unsupported-platform fallback) with `aspect-ratio: 16/9` iframe sizing per ui-contract.md (depends on T001)
- [X] T009 [P] [US1] Create `src/components/stream/WebcastSelector.tsx` rendering a `role="tablist"` pill row hidden when ≤1 webcast; active pill uses `rgb(150 29 55)`; overflow scrolls horizontally on mobile (depends on T001)
- [X] T010 [US1] Update `src/pages/WatchPage/WatchPage.tsx` to call `useWatchPageData()`, remove all `loadMockMatchWindows` / `MockStreamPanel` imports, wire `<WebcastSelector>` + `<WebcastPanel>` with `selectedWebcastId` state and `onSelect` handler (depends on T007, T008, T009)
- [X] T011 [US1] Add loading skeleton state and `noApiKey` / `noSubscribedTeams` early-exit screens to `src/pages/WatchPage/WatchPage.tsx` consistent with SchedulePage patterns (depends on T010)

**Checkpoint**: US1 complete — watch page shows live webcast with selector; mock stream panel fully retired

---

## Phase 4: User Story 2 — Next Match Bar (Priority: P1)

**Goal**: A persistent banner between the `WebcastSelector` and `WebcastPanel` showing the soonest upcoming match for any subscribed team with urgency styling (upcoming / soon / in-progress / hidden).

**Independent Test**: Using simulation clock targeting a time before a known match, navigate to `/watch` and confirm the bar shows match label, expected team numbers, and correct urgency state. Advance simulation to within 10 minutes and confirm the "soon" style activates. Pass the match start time and confirm "in progress".

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `src/components/watch/NextMatchBar.tsx` with `{ next: NextMatchInfo }` props; returns `null` when `status === 'none'`; renders urgency states (neutral / amber-accent / brand-pulse) with `aria-live="polite"` per ui-contract.md (depends on T001)
- [X] T013 [US2] Wire `<NextMatchBar>` into `src/pages/WatchPage/WatchPage.tsx` between the selector row and webcast panel; pass `deriveNextMatch(schedule.entries, effectiveUnix)` (depends on T003, T010, T012)

**Checkpoint**: US2 complete — next match bar visible with correct urgency; hidden when no upcoming matches

---

## Phase 5: User Story 3 — Live Conflict Alerts (Priority: P2)

**Goal**: Replace mock-data conflict detection on the watch page with live TBA schedule data using the shared `computeConflictMatchKeys` + `toMatchConflicts` pipeline.

**Independent Test**: Subscribe to two teams whose events overlap (use simulation clock). Navigate to `/watch` and confirm the conflict panel lists both match keys and team numbers. With only one subscribed team active, confirm the conflict panel is hidden.

### Implementation for User Story 3

- [X] T014 [US3] Update `src/pages/WatchPage/WatchPage.tsx` to compute conflicts from `schedule.entries` using `computeConflictMatchKeys` and `toMatchConflicts` (from `scheduleBuilder.ts`) rather than `deriveMatchConflicts(loadMockMatchWindows(), ...)` (depends on T005, T006, T010)
- [X] T015 [US3] Ensure partial-data warning banner (reuse SchedulePage's `PartialDataBanner` pattern or equivalent styled component) is shown in `src/pages/WatchPage/WatchPage.tsx` when any team status is `'error'` or `'no-event'` (depends on T014)

**Checkpoint**: US3 complete — conflict alerts driven by live TBA data; mock conflict pipeline fully removed

---

## Phase 6: User Story 4 — Live Upcoming Alerts List (Priority: P2)

**Goal**: Replace mock-data upcoming alerts on the watch page with live TBA schedule data. Urgency levels and ordering are computed relative to effective (simulated or real) time.

**Independent Test**: With subscribed teams, a valid API key, and simulation clock targeting an active event day, navigate to `/watch` and confirm the alerts list orders items by predicted time ascending, labels urgency correctly (upcoming / soon / now), and respects the simulated effective time.

### Implementation for User Story 4

- [X] T016 [US4] Update `src/pages/WatchPage/WatchPage.tsx` to derive `UpcomingMatchAlert[]` from `schedule.entries` (using `effectiveUnix` from the hook) rather than from `deriveUpcomingAlerts(loadMockMatchWindows(), trackedTeams)`; remove `useWatchPreferences` import if no longer needed (depends on T010)
- [X] T017 [US4] Verify urgency logic in `src/domain/services/alerts.ts` uses the effective time as reference rather than `new Date()` directly — refactor `getUrgency` to accept an optional reference `Date` parameter defaulting to `new Date()` so WatchPage can pass effective time (depends on T016)

**Checkpoint**: US4 complete — upcoming alerts list sourced entirely from TBA data; `loadMockMatchWindows` no longer imported anywhere in WatchPage

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tests, cleanup, responsive validation, and final wiring verification.

- [X] T018 [P] Add unit tests for `deriveNextMatch` covering all four `NextMatchStatus` states and edge cases (null predicted times, tie-break by priority) in `tests/unit/watchPage.test.ts`
- [X] T019 [P] Add unit tests for `buildWebcastOptions` covering Twitch embed URL construction (with hostname), YouTube embed URL, unsupported-platform fallback, and deduplication in `tests/unit/watchPage.test.ts`
- [X] T020 [P] Update `tests/integration/watch-page.test.tsx` to mock `fetchTeamEvents`, `fetchEventMatches`, `fetchEventDetail` and assert WatchPage renders `WebcastPanel`, `NextMatchBar`, and alerts/conflicts from mocked live data (not mock matches)
- [X] T021 [P] Update `tests/e2e/watch.spec.ts` to verify the webcast panel container renders, next-match bar is present when matches exist, alert list is present, and mock-stream panel selector no longer matches
- [X] T022 Delete or mark `src/components/stream/MockStreamPanel.tsx` as unused; confirm no remaining imports in the codebase
- [X] T023 [P] Verify responsive layout at 375 px and 768 px viewports: `WebcastSelector` pill row scrolls horizontally, `NextMatchBar` stacks to two lines, `WebcastPanel` iframe maintains aspect ratio

---

## Dependencies

```
T001 ──► T002
T001 ──► T003
T001 ──► T004
T001 ──► T005 ──► T006 ──► T007
T002 ──────────────────────► T007
T003 ──────────────────────► T007
T004 ──────────────────────► T007
T001 ──► T008
T001 ──► T009
T007 ──► T010 ──► T011
T008 ──► T010
T009 ──► T010
T001 ──► T012
T003, T010, T012 ──► T013
T005, T006, T010 ──► T014 ──► T015
T010 ──► T016 ──► T017
T003, T004 ──► T018, T019 (tests)
T010 ──► T020, T021 (tests)
T010 ──► T022
```

## Parallel Execution Examples

### After T001 completes — run in parallel:
- T002 (tbaClient extension)
- T003 (deriveNextMatch)
- T004 (buildWebcastOptions)
- T005 (move computeConflictMatchKeys)
- T008 (WebcastPanel scaffold)
- T009 (WebcastSelector scaffold)

### After T007 (hook) + T008 + T009 complete — run in parallel:
- T010 → T011 (WatchPage wiring)
- T012 (NextMatchBar component)

### After T010 completes — run in parallel:
- T013 (Next Match Bar wiring)
- T014 (conflict wiring)
- T016 (alerts wiring)
- T020, T021 (test updates)

### After T014, T016 complete — run in parallel:
- T015 (partial-data banner)
- T017 (urgency refactor)
- T018, T019 (unit tests)
- T022 (MockStreamPanel cleanup)
- T023 (responsive verification)

## Implementation Strategy

**MVP scope (Phase 1–3 + Phase 2)**: T001–T011 delivers a fully live-data WatchPage with webcast embed and selector. User Stories 1 and 2 are complete.

**Full delivery**: T001–T023 covers all four user stories and polish. Phases 5–6 (conflict and alerts live data) can be parallelised with Phase 4 (Next Match Bar) once T007 and T010 are done.

**Suggested order for a single developer**:
1. T001 → T002, T003, T004, T005 (types + pure functions, ~1 session)
2. T006, T007 (hook — depends on all above, ~1 session)
3. T008, T009, T010, T011, T012, T013 (components + wiring, ~1 session)
4. T014, T015, T016, T017 (live alerts + conflicts, ~1 session)
5. T018–T023 (tests + polish, ~1 session)
