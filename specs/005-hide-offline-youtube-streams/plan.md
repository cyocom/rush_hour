# Implementation Plan: Hide Offline YouTube Streams

**Branch**: `005-new-specification` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-hide-offline-youtube-streams/spec.md`

## Summary

Add stream availability awareness for YouTube webcast options so that when at least one stream is online, offline YouTube entries are hidden from the primary selection list, and when no streams are online the full list is still shown with offline status badges. Implementation introduces a client-side stream availability service, extends webcast view models with availability state, and updates Watch page UI and tests for fallback behavior.

## Technical Context

**Language/Version**: TypeScript ~6.0  
**Primary Dependencies**: React 19, React Router 7, Tailwind CSS, styled-components 6, date-fns 4, Vite 8  
**Storage**: `localStorage` only for existing watch preferences; no new persistent keys required  
**Testing**: Vitest (unit + integration), Playwright (e2e)  
**Target Platform**: Static web application in modern desktop/mobile browsers  
**Project Type**: Single-project web application (SPA)  
**Performance Goals**: Availability refresh integrated into existing 60s watch refresh cycle; status indicator render updates < 200ms after data arrival  
**Constraints**: Static-first architecture, no server runtime, graceful fallback when availability probing fails, no blocking UI on availability checks  
**Scale/Scope**: Typical watch session with a small set of webcast options per active event (generally 1-8)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality First | PASS | Logic split into a dedicated availability service and pure selection utilities; no implicit UI-side heuristics. |
| II. Responsive & Accessible | PASS | Offline status is visible via text badge and does not rely on color-only signaling; fallback states remain readable on small screens. |
| III. Static-First Architecture | PASS | Uses browser-only probing and existing TBA data; no backend introduced. |
| IV. Performance & Feedback | PASS | Non-blocking status refresh; immediate user messaging when all streams are offline or status is uncertain. |

**Post-design re-check**: All gates remain PASS after defining data model and UI contracts.

## Project Structure

### Documentation (this feature)

```text
specs/005-hide-offline-youtube-streams/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── models/
│   │   └── schedule.ts                       # MODIFY: webcast availability fields
│   └── services/
│       ├── watchPage.ts                      # MODIFY: apply availability filtering + fallback
│       └── streamAvailability.ts             # NEW: YouTube availability probing + normalization
├── components/
│   └── stream/
│       ├── WebcastSelector.tsx               # MODIFY: offline badges + fallback message
│       └── WebcastPanel.tsx                  # MODIFY: status-aware empty/offline messaging
└── pages/
    └── WatchPage/
        └── WatchPage.tsx                     # MODIFY: wire availability-aware visible webcast set

tests/
├── unit/
│   ├── watchPage.test.ts                     # MODIFY: filtering/fallback unit scenarios
│   └── streamAvailability.test.ts            # NEW: probing normalization and failure handling
├── integration/
│   └── watch-page.test.tsx                   # MODIFY: offline badge and fallback rendering checks
└── e2e/
    └── watch.spec.ts                         # MODIFY: offline fallback behavior in browser flow
```

**Structure Decision**: Keep existing single-project layout. Add one focused domain service (`streamAvailability.ts`) and extend existing watch UI and tests in place.

## Complexity Tracking

No constitution violations identified. No complexity exceptions required.
