# Tasks: FIRST Robotics Watch Experience

**Input**: Design documents from `/specs/001-frc-watch-experience/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [Shared] Initialize Vite React TypeScript app and scripts in package.json
- [X] T002 [P] [Shared] Configure Tailwind CSS theme tokens in src/styles/tokens.css and tailwind.config.ts
- [X] T003 [P] [Shared] Configure routing shell for `/watch` and `/config` in src/app/router.tsx and src/app/App.tsx
- [X] T004 [P] [Shared] Configure Vitest + React Testing Library in vitest.config.ts and tests/setup.ts
- [X] T005 [P] [Shared] Configure Playwright smoke test harness in playwright.config.ts and tests/e2e/

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T006 [Shared] Define core domain types in src/domain/models/watch.ts
- [X] T007 [P] [Shared] Implement tracked-team validation and rank normalization in src/domain/validation/teams.ts
- [X] T008 [P] [Shared] Implement session storage repository in src/domain/services/sessionPreferences.ts
- [X] T009 [P] [Shared] Add mock match dataset and typed loaders in src/data/mock/matches.ts
- [X] T010 [Shared] Implement alert derivation + deduplication in src/domain/services/alerts.ts
- [X] T011 [Shared] Implement conflict overlap detection in src/domain/services/conflicts.ts
- [X] T012 [P] [Shared] Build reusable page layout and status components in src/components/layout/PageShell.tsx and src/components/status/

## Phase 3: User Story 1 - Track Match Alerts on Watch Page

### Tests
- [X] T013 [P] [US1] Add unit tests for alert derivation + dedupe in tests/unit/alerts.test.ts
- [X] T014 [P] [US1] Add unit tests for conflict overlap windows in tests/unit/conflicts.test.ts
- [X] T015 [P] [US1] Add integration test for watch page render states in tests/integration/watch-page.test.tsx
- [X] T016 [P] [US1] Add Playwright smoke for watch alerts/conflicts in tests/e2e/watch.spec.ts

### Implementation
- [X] T017 [P] [US1] Implement mock stream panel component in src/components/stream/MockStreamPanel.tsx
- [X] T018 [P] [US1] Implement upcoming alerts list component in src/components/alerts/UpcomingAlertsList.tsx
- [X] T019 [P] [US1] Implement conflict notifications component in src/components/alerts/ConflictList.tsx
- [X] T020 [US1] Implement watch-page orchestration in src/pages/WatchPage/WatchPage.tsx
- [X] T021 [US1] Add empty/no-upcoming guidance states and navigation cue to `/config` in src/pages/WatchPage/WatchPage.tsx

## Phase 4: User Story 2 - Configure Team Priority List

### Tests
- [X] T022 [P] [US2] Add unit tests for validation/rank normalization in tests/unit/teams-validation.test.ts
- [X] T023 [P] [US2] Add integration test for add/remove/reorder flow in tests/integration/config-page.test.tsx
- [X] T024 [P] [US2] Add Playwright smoke for config workflow in tests/e2e/config.spec.ts

### Implementation
- [X] T025 [P] [US2] Implement team input form with inline validation in src/components/teams/TeamInputForm.tsx
- [X] T026 [P] [US2] Implement prioritized team list with drag/drop and keyboard fallback in src/components/teams/PriorityTeamList.tsx
- [X] T027 [US2] Implement config-page state/actions in src/pages/ConfigPage/ConfigPage.tsx
- [X] T028 [US2] Wire preference loading/saving lifecycle in src/app/App.tsx and src/domain/services/sessionPreferences.ts

## Phase 5: User Story 3 - Consistent Visual Theme

### Tests
- [X] T029 [P] [US3] Add integration tests asserting shared theme classes/tokens in tests/integration/theme-consistency.test.tsx
- [X] T030 [P] [US3] Add responsive viewport smoke checks in tests/e2e/responsive-theme.spec.ts

### Implementation
- [X] T031 [P] [US3] Define and apply brand tokens in src/styles/tokens.css and src/styles/global.css
- [X] T032 [P] [US3] Apply shared typography/spacing system in src/components/layout/PageShell.tsx and src/styles/global.css
- [X] T033 [US3] Ensure contrast/focus/accessibility states are consistent across watch/config components

## Phase 6: Polish & Cross-Cutting

- [X] T034 [P] [Shared] Add README implementation notes and local run/test commands in README.md
- [X] T035 [Shared] Run full test suite (unit, integration, e2e) and fix regressions
- [X] T036 [Shared] Validate quickstart flow and capture deltas
- [X] T037 [Shared] Verify no third-party data requests are present (FR-010)
