# Implementation Plan: Watch Page Live Integration

**Branch**: `003-watch-page-integration` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-watch-page-integration/spec.md`

## Summary

Replace the WatchPage's mock data pipeline with live TBA API data. Add a real webcast embed panel (Twitch/YouTube) with a pill-selector for multiple webcasts, a "next match" bar showing the soonest upcoming match across subscribed teams, and conflict/alert lists driven by the same unified schedule already built for the SchedulePage. The webcast defaulted to the event hosting the soonest match; webcasts for unsupported platforms degrade to an external link; all timing logic respects the simulation clock.

## Technical Context

**Language/Version**: TypeScript ~6.0  
**Primary Dependencies**: React 19, React Router 7, styled-components 6, Tailwind CSS, date-fns 4, Vite 8  
**Storage**: `localStorage` (subscribed teams, simulation clock, TBA API key, response cache)  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (e2e)  
**Target Platform**: Static web app — modern desktop and mobile browsers  
**Project Type**: Single-page web application  
**Performance Goals**: Watch page interactive within 3 seconds of navigation; webcast embed displayed as soon as TBA response resolves  
**Constraints**: Static deployment (no server-side runtime); all state in client storage; TBA API v3 only; no additional platform API keys  
**Scale/Scope**: Single-user browser session; typically 1–6 subscribed teams; 1–2 simultaneous active events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality First | ✅ PASS | Watch page data loading will be extracted into a shared hook to avoid copy-paste from SchedulePage; components are single-responsibility |
| II. Responsive & Accessible | ✅ PASS | WebcastPanel, NextMatchBar, and toggle row must all be tested at mobile viewports; embed uses `aspect-ratio: 16/9` |
| III. Static-First Architecture | ✅ PASS | All data from TBA API (client-side fetch); embed via `<iframe>` client-side; no server runtime |
| IV. Performance & Feedback | ✅ PASS | Loading skeleton shown during TBA fetch; partial data banner shown on fetch failures; webcast defaults immediately to first available once resolved |

**Gate result: PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/003-watch-page-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── models/
│   │   └── schedule.ts           # + TBAWebcast, WebcastOption types
│   └── services/
│       ├── tbaClient.ts          # + fetchEventDetail()
│       ├── scheduleBuilder.ts    # (unchanged)
│       └── watchPage.ts          # NEW: useWatchPageData hook + deriveNextMatch()
├── components/
│   ├── stream/
│   │   ├── MockStreamPanel.tsx   # RETIRED (replaced)
│   │   ├── WebcastPanel.tsx      # NEW: iframe embed + provider fallbacks
│   │   └── WebcastSelector.tsx  # NEW: pill/tab toggle row
│   ├── watch/
│   │   └── NextMatchBar.tsx      # NEW: soonest upcoming match banner
│   ├── alerts/
│   │   ├── UpcomingAlertsList.tsx  # adapted to ScheduledMatchEntry source
│   │   └── ConflictList.tsx        # adapted to ScheduledMatchEntry source
│   └── layout/
│       └── PageShell.tsx           # (unchanged)
└── pages/
    └── WatchPage/
        └── WatchPage.tsx           # Rewritten to use live data hook

tests/
├── unit/
│   ├── watchPage.test.ts           # NEW: deriveNextMatch, webcast selection logic
│   └── (existing tests unchanged)
├── integration/
│   └── watch-page.test.tsx         # UPDATED: live data flow w/ mocked TBA
└── e2e/
    └── watch.spec.ts               # UPDATED: webcast panel + next match bar
```

**Structure Decision**: Single-project web app. New files added alongside existing patterns. `MockStreamPanel` retired in favour of `WebcastPanel`. Data-loading logic extracted to `src/domain/services/watchPage.ts` to keep WatchPage lean and avoid duplicating SchedulePage fetch logic.
