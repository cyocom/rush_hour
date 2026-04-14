# Quickstart: Watch Page Live Integration

**Feature Branch**: `003-watch-page-integration`  
**Date**: 2026-04-13

---

## Prerequisites

- Node.js 20+ and pnpm installed
- A valid TBA API key (obtain from https://www.thebluealliance.com/account)
- At least one FRC team subscribed in the app Config page

---

## 1. Install Dependencies

```bash
pnpm install
```

No new runtime dependencies are introduced by this feature. All changes are within the existing dependency set.

---

## 2. Start the Dev Server

```bash
pnpm dev
```

The app runs at `http://localhost:5173`.

---

## 3. Configure the App

1. Open `http://localhost:5173/config`
2. Enter your TBA API key in the API Key field and save.
3. Add one or more team numbers (e.g. `254`, `1678`) to the subscribed teams list.
4. Optionally enable the **Simulation Clock** and set a date/time that falls within a known event window (e.g. a recent district event date) to test watch-page logic without a live event.

---

## 4. Use the Watch Page

Navigate to `http://localhost:5173/` (the Watch page).

**What you should see:**

- **WebcastSelector pill row** (if multiple webcasts available): appears above the stream panel; click pills to switch webcasts.
- **WebcastPanel**: embedded Twitch or YouTube stream for the event of your subscribed teams' next upcoming match. If no webcast is registered, a fallback with a TBA link is shown.
- **NextMatchBar**: banner directly below the selector / above the embed showing the soonest upcoming match, team numbers, and time-until or "In Progress" status.
- **Upcoming Alerts**: list of all upcoming matches for subscribed teams, time-ordered.
- **Conflict Warnings**: appears if two or more subscribed teams have matches within 5 minutes of each other.

---

## 5. Simulate a Live Event (No Active Events Today)

Since no FRC events may be running on the current date:

1. Go to `/config` → Simulation Clock.
2. Enable simulation and enter a date/time that falls within a past event window for one of your subscribed teams (e.g., a 2025 district event date).
3. Save and navigate to `/watch`.
4. The watch page will fetch TBA data as if it were that date and render webcasts, next-match bar, and conflict alerts accordingly.

> **Note**: For teams and events that have concluded, TBA still returns match data (including `predicted_time`). The simulation clock controls which matches are "upcoming" from the app's perspective.

---

## 6. Run Tests

```bash
# Unit + integration tests
pnpm test

# E2E tests (requires dev server running)
pnpm exec playwright test
```

Key test files for this feature:
- `tests/unit/watchPage.test.ts` — `deriveNextMatch`, `buildWebcastOptions` pure function tests
- `tests/integration/watch-page.test.tsx` — WatchPage render with mocked TBA responses
- `tests/e2e/watch.spec.ts` — Webcast panel, next-match bar, alerts, conflicts end-to-end

---

## 7. Key Files Changed in This Feature

| File | Change |
|------|--------|
| `src/domain/models/schedule.ts` | Added `TBAWebcast`, `TBAEventDetail`, `WebcastOption`, `WebcastPlatform`, `NextMatchInfo`, `NextMatchStatus`, `WatchPageState`, `WatchPageLoadStatus` |
| `src/domain/services/tbaClient.ts` | Added `fetchEventDetail(eventKey, apiKey)` |
| `src/domain/services/scheduleBuilder.ts` | Moved `computeConflictMatchKeys` here from SchedulePage; exported `toMatchConflicts` adapter |
| `src/domain/services/watchPage.ts` | New: `useWatchPageData` hook, `deriveNextMatch`, `buildWebcastOptions` |
| `src/components/stream/WebcastPanel.tsx` | New: replaces `MockStreamPanel` |
| `src/components/stream/WebcastSelector.tsx` | New: pill/tab toggle row |
| `src/components/watch/NextMatchBar.tsx` | New: next-match banner |
| `src/pages/WatchPage/WatchPage.tsx` | Rewritten to use `useWatchPageData`; removes mock data imports |
| `src/pages/SchedulePage/SchedulePage.tsx` | Calls `computeConflictMatchKeys` from `scheduleBuilder` instead of inline; otherwise unchanged |
