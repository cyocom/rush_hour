# Implementation Plan: Config Page and Schedule View

**Branch**: `002-run-git-feature-hook` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-config-schedule-page/spec.md`

## Summary

Add persistent team subscriptions and a simulation clock to the Config page, then build a new Schedule page that fetches live upcoming-match data from The Blue Alliance API v3, merges matches across subscribed teams, and presents them in a single chronological list — using `localStorage` for cross-session settings and browser-side fetch for the TBA REST API.

## Technical Context

**Language/Version**: TypeScript ~6.0  
**Primary Dependencies**: React 19, React Router 7, Tailwind CSS, styled-components 6, date-fns 4, Vite 8  
**Storage**: `localStorage` (cross-session: subscribed teams, sim clock, TBA API key, response cache); `sessionStorage` (existing in-session watch preferences — unchanged)  
**Testing**: Vitest 4 + React Testing Library 16 + Playwright 1.59  
**Target Platform**: Static SPA in modern browser (Chrome/Firefox/Safari); deployed to static web host  
**Project Type**: Web application (single-page app)  
**Performance Goals**: Schedule page first meaningful content in <2s on broadband; cached repeat loads <500ms  
**Constraints**: Static deployment (no server-side runtime); all API calls from browser via CORS; TBA responses cached 5 min in `localStorage`  
**Scale/Scope**: ~50 subscribed teams; ~1 active event per team; ~100 matches per event per fetch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design Status | Post-Design Status |
|-----------|------------------|--------------------|
| I. Code Quality First | ✅ New services (`tbaClient`, `scheduleBuilder`, `persistentPreferences`) follow single-responsibility; pure functions in builder | ✅ Confirmed: each service has one clear concern |
| II. Responsive & Accessible | ✅ Schedule page must work from 320px; match list reflows to stacked layout below 640px | ✅ Confirmed: UI contract specifies responsive from 320px |
| III. Static-First Architecture | ✅ TBA API called directly from browser (CORS-enabled); no proxy; API key stored in `localStorage` | ✅ Confirmed: no server-side dependency added |
| IV. Performance & Feedback | ✅ Loading indicator during all TBA fetches; TTL cache avoids redundant network calls | ✅ Confirmed: `schedule-load-status` hook and 5-min cache specified |

**Gate result**: No violations. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/002-config-schedule-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code Changes

```text
src/
├── domain/
│   ├── models/
│   │   ├── watch.ts                    # Existing — unchanged
│   │   └── schedule.ts                 # NEW: TBA types + app preference types
│   └── services/
│       ├── sessionPreferences.ts       # Existing — unchanged
│       ├── persistentPreferences.ts    # NEW: localStorage read/write for appPreferences
│       ├── tbaClient.ts                # NEW: TBA API fetch wrapper with cache
│       └── scheduleBuilder.ts          # NEW: active-event detection, filter, merge, sort
├── pages/
│   ├── ConfigPage/
│   │   └── ConfigPage.tsx              # Existing — augmented with 3 new sections
│   └── SchedulePage/
│       └── SchedulePage.tsx            # NEW: /schedule route
├── components/
│   └── schedule/
│       ├── ScheduleEntry.tsx           # NEW: single match row
│       └── ScheduleEmptyState.tsx      # NEW: empty/no-event/no-key states
└── app/
    └── router.tsx                      # Existing — add /schedule route entry

tests/
├── unit/
│   ├── scheduleBuilder.test.ts         # NEW
│   ├── persistentPreferences.test.ts   # NEW
│   └── tbaClient.test.ts               # NEW
├── integration/
│   └── schedule-page.test.tsx          # NEW
└── e2e/
    └── schedule.spec.ts                # NEW
```

**Structure Decision**: Single web application project under `src/`. Extends existing file layout from feature 001. No new packages or separate compilation units needed.

## Complexity Tracking

> No Constitution violations to justify.
