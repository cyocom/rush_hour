# Tasks: Shareable Configuration URL

**Feature**: 004-shareable-config-url  
**Branch**: `004-shareable-config-url`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Date**: 2026-04-17

---

## Overview

This feature introduces three coordinated changes:

1. **HashRouter migration** — replace `createBrowserRouter` with `createHashRouter` for correct GitHub Pages deployment
2. **Share URL generation** — encode team list + optional API key as `/#/share/<Base64>`
3. **Import flow** — dedicated route with confirmation dialog

**MVP Scope**: Complete User Stories 1 & 2 (both P1). Story 3 (API key opt-out toggle) is included to enable secure sharing control.

**Total Tasks**: 24 | **Parallelizable**: 8

---

## Dependency Graph

```
Phase 1 Setup (T001–T004)
  ↓
Phase 2 Foundational (T005–T009)
  ├─→ Phase 3: US1 (T010–T015) [P]
  ├─→ Phase 4: US2 (T016–T019)
  └─→ Phase 5: US3 (T020–T021)
      ↓
Phase 6: Polish & Validation (T022–T024)
```

**Key blocking dependencies:**
- T005 (shareUrl.ts service) blocks T010, T012, T016
- T006 (router /share/:payload) blocks T016
- T015 (ConfigPage integration) blocks manual testing

---

## Phase 1: Setup

- [X] T001 Add `homepage` field to `package.json` set to `https://cyocom.github.io/rush_hour/`
- [X] T002 Create `src/pages/SharePage/` directory structure
- [X] T003 Migrate router from `createBrowserRouter` to `createHashRouter` in `src/app/router.tsx` — remove `basename`, add stub for `/share/:payload` route
- [X] T004 Verify type compatibility — confirm `createHashRouter` and React Router 7 integration works with existing code

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T005 [P] Implement `src/domain/services/shareUrl.ts` with `buildShareUrl(teams, apiKey)` and `decodeSharePayload(encoded)` functions using URL-safe Base64
- [X] T006 Add `/share/:payload` route to router in `src/app/router.tsx`, mapped to `<SharePage />` component (stub OK for now)
- [X] T007 [P] Create unit tests in `tests/unit/shareUrl.test.ts` covering encode/decode round-trips, malformed inputs, edge cases (100 teams size check)
- [X] T008 [P] Set up `ShareConfigDialog.tsx` skeleton in `src/components/config/` with placeholder props
- [X] T009 [P] Set up `SharePage.tsx` skeleton in `src/pages/SharePage/` with placeholder route integration

---

## Phase 3: User Story 1 – Generate and Copy a Shareable Configuration Link (P1)

- [X] T010 [P] [US1] Implement `ShareConfigDialog.tsx` component with URL display field and copy button in `src/components/config/ShareConfigDialog.tsx`
- [X] T011 [P] [US1] Implement clipboard copy handler with success/failure feedback — fallback to text selection on permission denied in `src/components/config/ShareConfigDialog.tsx`
- [X] T012 [P] [US1] Implement "Share Configuration" button in `src/pages/ConfigPage/ConfigPage.tsx` that opens `ShareConfigDialog` (disabled when no teams subscribed)
- [X] T013 [US1] Integrate `trackedTeams` and `tbaApiKey` context into `ShareConfigDialog` to generate live URL preview in `src/components/config/ShareConfigDialog.tsx`
- [X] T014 [US1] Test share URL generation with various team list sizes (1, 10, 100 teams) — verify size < 2000 chars in manual verification
- [X] T015 [US1] Verify share button state (enabled/disabled) reflects team subscription in Config page UI

---

## Phase 4: User Story 2 – Import Configuration from a Shared URL (P1)

- [X] T016 [P] [US2] Implement `SharePage.tsx` route component with payload decode logic in `src/pages/SharePage/SharePage.tsx` — handle malformed payloads with silent redirect to `/#/watch`
- [X] T017 [US2] Implement import confirmation dialog in `SharePage.tsx` displaying decoded teams and API key status before any changes
- [X] T018 [US2] Implement accept/decline buttons in `SharePage.tsx` — accept writes teams + optional API key via `writePersistentPreferences`, then `window.location.replace('/#/watch')`; decline redirects without changes
- [X] T019 [P] [US2] Create integration tests in `tests/integration/share-page.test.tsx` covering valid payload decode, confirmation flow, malformed payload handling

---

## Phase 5: User Story 3 – Opt Out of Sharing the API Key (P2)

- [X] T020 [P] [US3] Add "Include API key" checkbox to `ShareConfigDialog.tsx` — shown when API key is configured, unchecked by default (user must opt in to include it)
- [X] T021 [US3] Update URL generation logic in `src/domain/services/shareUrl.ts` to conditionally omit `key` field when checkbox is unchecked in `src/components/config/ShareConfigDialog.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T022 Update all Playwright E2E tests to use hash paths (`/#/watch`, `/#/config`, `/#/schedule`) in `tests/e2e/smoke.spec.ts`, `tests/e2e/config.spec.ts`, `tests/e2e/watch.spec.ts`, `tests/e2e/responsive-theme.spec.ts`
- [X] T023 Run full test suite (`pnpm test && pnpm test:e2e`) — verify all tests pass with updated router
- [X] T024 Manual verification checklist (see quickstart.md) — share URL generation, import flow, clipboard fallback, malformed URLs, hash routing without 404

---

## Parallel Execution Examples

### Phase 3 Parallelization (US1)
Run T010, T011, T012, T013 in parallel; they touch different files and have no cross-dependencies:

```bash
# Terminal 1
npm run dev
# Terminal 2
code src/components/config/ShareConfigDialog.tsx  # T010, T011, T013
# Terminal 3
code src/pages/ConfigPage/ConfigPage.tsx  # T012
```

### Phase 2 Parallelization (Foundational)
Run T005, T007, T008, T009 in parallel — all setup/skeleton work:

```bash
# Terminal 1: Service + tests
code src/domain/services/shareUrl.ts  # T005
code tests/unit/shareUrl.test.ts  # T007

# Terminal 2: Components
code src/components/config/ShareConfigDialog.tsx  # T008
code src/pages/SharePage/SharePage.tsx  # T009
```

---

## Implementation Strategy

### MVP Scope
Deliver Stories 1, 2, and 3 together as a cohesive feature. All three are necessary for a secure sharing experience:
- Story 1 alone = no way for recipients to import
- Story 2 alone = security risk (no opt-out)
- Story 3 alone = useless without generation and import

### Incremental Delivery (Recommended)
1. **Setup Phase** (T001–T004) — prepare infrastructure
2. **Foundational Phase** (T005–T009) — implement shared service and router
3. **US1 Phase** (T010–T015) — share generation works end-to-end
4. **US2 Phase** (T016–T019) — import flow works end-to-end
5. **US3 Phase** (T020–T021) — add API key toggle
6. **Testing Phase** (T022–T024) — verify all flows and update E2E tests

This allows intermediate validation: after T015, users can generate and copy share URLs. After T019, recipients can import them.

---

## Success Criteria (Task Completion)

- ✅ All tasks completed and passing (`pnpm test && pnpm test:e2e`)
- ✅ Share URL generation < 100 ms, < 2000 chars for 100 teams
- ✅ Share URL successfully copied to clipboard (or fallback to selection)
- ✅ Import confirmation dialog appears on valid share URL navigation
- ✅ Import accepts/declines without errors
- ✅ Malformed URLs silently redirect (no error states)
- ✅ Direct hash navigation (`/#/watch`, `/#/config`) works without 404
- ✅ API key opt-out toggle works — omits key from URL when unchecked
