# Tasks: Hide Offline YouTube Streams

**Input**: Design documents from `/specs/005-hide-offline-youtube-streams/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline and establish feature scaffolding.

- [X] T001 Confirm watch stream baseline behavior and capture fixtures in `tests/unit/watchPage.test.ts` and `tests/integration/watch-page.test.tsx`
- [X] T002 Add availability-related type placeholders in `src/domain/models/schedule.ts` for `StreamAvailability`, `AvailabilityProbeResult`, and `VisibleWebcastSet`
- [X] T003 Create `src/domain/services/streamAvailability.ts` with exported probe interfaces and no-op safe defaults

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core availability plumbing required by all user stories.

**CRITICAL**: No user story implementation starts before this phase completes.

- [X] T004 Implement YouTube probe normalization in `src/domain/services/streamAvailability.ts` (online/offline/unknown + timeout handling)
- [X] T005 [P] Extend webcast construction in `src/domain/services/watchPage.ts` so every `WebcastOption` includes availability fields
- [X] T006 [P] Add visibility-policy utility in `src/domain/services/watchPage.ts` to compute `online-only` vs `fallback-show-all`
- [X] T007 Wire availability refresh into `useWatchPageData` in `src/domain/services/watchPage.ts` without blocking initial schedule render
- [X] T008 Add stale-status signaling output from `src/domain/services/watchPage.ts` for UI messaging consumption

**Checkpoint**: Availability data and visibility policy are available to the Watch page.

---

## Phase 3: User Story 1 - Focus On Live Streams (Priority: P1) MVP

**Goal**: Hide offline YouTube streams when at least one stream is online; fallback to show all streams with offline flags when none are online.

**Independent Test**: Open a match with mixed online/offline YouTube streams; verify only online options are shown. Open a match with no online streams; verify all streams remain visible and flagged offline.

### Implementation for User Story 1

- [X] T009 [US1] Apply event-scoped availability filtering in `src/pages/WatchPage/WatchPage.tsx` using visibility mode from watch-page service data
- [X] T010 [P] [US1] Update stream-pill rendering in `src/components/stream/WebcastSelector.tsx` to support mode-aware display and offline/unknown badges
- [X] T011 [P] [US1] Update stream messaging in `src/components/stream/WebcastPanel.tsx` for "no streams online" fallback notice
- [X] T012 [US1] Ensure selected webcast resolution in `src/pages/WatchPage/WatchPage.tsx` prefers visible online options in `online-only` mode
- [X] T013 [US1] Add/adjust unit coverage for mixed-stream and no-online fallback behavior in `tests/unit/watchPage.test.ts`
- [X] T014 [US1] Add integration coverage for offline badge + fallback message rendering in `tests/integration/watch-page.test.tsx`

**Checkpoint**: US1 delivers live-first selector behavior with all-offline fallback.

---

## Phase 4: User Story 2 - Preserve Access To Other Stream Types (Priority: P2)

**Goal**: Keep non-YouTube streams visible and selectable regardless of YouTube availability status.

**Independent Test**: Use a match with offline YouTube streams plus non-YouTube streams; verify non-YouTube options remain visible in both modes.

### Implementation for User Story 2

- [X] T015 [US2] Constrain hide logic in `src/domain/services/watchPage.ts` so only YouTube options are filtered by availability
- [X] T016 [US2] Keep non-YouTube entries visible in both visibility modes in `src/pages/WatchPage/WatchPage.tsx`
- [X] T017 [P] [US2] Update selector labels/badges in `src/components/stream/WebcastSelector.tsx` so non-YouTube options remain clear and unaffected by YouTube-only policy
- [X] T018 [US2] Add unit coverage for non-YouTube retention behavior in `tests/unit/watchPage.test.ts`
- [X] T019 [US2] Add e2e assertion for mixed-provider behavior in `tests/e2e/watch.spec.ts`

**Checkpoint**: US2 ensures provider-scope boundaries are preserved with no regressions.

---

## Phase 5: User Story 3 - Keep Selection Stable During Status Changes (Priority: P3)

**Goal**: Maintain predictable selection and user feedback when stream statuses change during an active session.

**Independent Test**: Select a YouTube stream, simulate status transition to offline on refresh, verify visible options update and user receives clear status-change feedback.

### Implementation for User Story 3

- [X] T020 [US3] Add selection continuity handling in `src/pages/WatchPage/WatchPage.tsx` when a selected stream becomes hidden by mode changes
- [X] T021 [US3] Add explicit status-change messaging path in `src/components/stream/WebcastPanel.tsx` for selected stream going offline
- [X] T022 [US3] Preserve per-event selection recovery behavior in `src/pages/WatchPage/WatchPage.tsx` when availability mode flips back to online-only
- [X] T023 [P] [US3] Add unit coverage for transition cases (online->offline->online) in `tests/unit/watchPage.test.ts`
- [X] T024 [US3] Add integration coverage for status-change feedback and recoverability in `tests/integration/watch-page.test.tsx`

**Checkpoint**: US3 keeps stream switching predictable and recoverable across refreshes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and feature-level validation.

- [X] T025 [P] Update implementation notes and verification checklist in `specs/005-hide-offline-youtube-streams/quickstart.md` if behavior diverged during implementation
- [X] T026 Run targeted suites: `pnpm test -- watchPage`, `pnpm test -- watch-page`, and `pnpm test:e2e -- watch`
- [X] T027 Run full regression suite with `pnpm test` and document any residual risks in `specs/005-hide-offline-youtube-streams/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2 completion; can run after or alongside late US1 polish.
- **Phase 5 (US3)**: Depends on Phase 3 (needs baseline mode behavior) and Phase 2.
- **Phase 6 (Polish)**: Depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: First deliverable and MVP slice.
- **US2 (P2)**: Builds on foundational availability policy but must remain independently testable.
- **US3 (P3)**: Builds on US1 selection behavior and refresh lifecycle.

### Within Each User Story

- Service/data logic before UI wiring.
- UI wiring before scenario-specific messaging polish.
- Automated verification tasks complete before story checkpoint sign-off.

## Parallel Opportunities

- T005 and T006 can run in parallel after T004.
- T010 and T011 can run in parallel after T009 begins.
- T017 can run in parallel with T016.
- T023 can run in parallel with T021/T022 once transition behavior is implemented.
- T025 and T026 can run in parallel during final validation.

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1 and 2.
2. Complete Phase 3 (US1).
3. Validate US1 independently against its acceptance scenarios.
4. Demo/deploy MVP if desired.

### Incremental Delivery

1. Deliver US1 (live-first + all-offline fallback).
2. Deliver US2 (provider-scope guardrails).
3. Deliver US3 (selection stability during status transitions).
4. Run Phase 6 hardening and regression validation.

### Parallel Team Strategy

1. Team aligns on Phase 1 + 2 foundations.
2. After foundation checkpoint:
   - Engineer A: US1 UI behavior (T009-T014)
   - Engineer B: US2 provider constraints (T015-T019)
   - Engineer C: US3 transition handling (T020-T024)
3. Rejoin for Phase 6 validation and release readiness.

## Notes

- `[P]` tasks target different files and can be parallelized safely.
- Keep story boundaries intact so each story can be validated independently.
- Prefer small commits by task cluster (service, UI, tests).
- Avoid introducing persistent user preferences for filter behavior in this feature.
