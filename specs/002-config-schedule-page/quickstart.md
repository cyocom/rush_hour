# Quickstart: Config Page and Schedule View

## Overview

This guide covers the new capabilities in feature 002:
1. **Persistent subscribed teams** — teams stored in `localStorage` for cross-session use on the schedule page.
2. **Simulation clock** — override the effective business time to test schedule logic on any date.
3. **TBA API integration** — live match data from The Blue Alliance.
4. **Schedule page** — unified upcoming match list for all subscribed teams.

---

## Prerequisites

- Node 22+ and pnpm installed (`npm i -g pnpm` if needed).
- Dev server: `pnpm dev` (runs Vite on `http://localhost:5173`).
- A TBA read API key from https://www.thebluealliance.com/account (free, read-only).

---

## 1. Configure a TBA API Key

The Schedule page requires a TBA API key. Enter it once on the Config page; it is persisted in `localStorage`.

1. Open `/config`.
2. Find the **TBA API Key** section.
3. Paste your key and click **Save**.
4. The status indicator changes to "Key configured".

> Under the hood: stored in `rushhour.appPreferences.v1.tbaApiKey` in `localStorage`.

---

## 2. Subscribe to Teams

Subscribed teams drive the schedule page. These are distinct from the in-session "tracked teams" used by the watch page.

1. Open `/config`.
2. In the **Subscribed Teams** section, type a team number (1–9999) and click **Add**.
3. The team appears in the subscribed list and is immediately persisted.
4. To remove a team, click the **Remove** button next to it.

**Validation**: Only numeric team numbers (1–4 digits) are accepted. Duplicates are blocked with an error message.

---

## 3. Use Simulation Mode

When no live events are running, use the simulation clock to test schedule logic:

1. Open `/config`.
2. In the **Simulation Clock** section, toggle **Enable simulation mode**.
3. Set a date and time (e.g., a competition weekend date/time during an event).
4. Click **Save**.
5. The active indicator shows the simulated time, and the Schedule page will fetch data as though it is that date/time.

To return to real time, toggle simulation mode off and save.

> Effective time used throughout: `SimulationClock.enabled ? parseISO(simulatedISOString) : new Date()`

---

## 4. View the Schedule

1. Navigate to `/schedule`.
2. The page fetches the current-season events for each subscribed team from TBA.
3. For each team, it finds the event active at the effective business time.
4. It fetches that event's matches, filters to upcoming (predicted time > effective time), and merges into a single sorted list.

**Loading state**: A spinner is displayed while TBA fetches are in flight.

**Empty state**: If no subscribed teams have an active event at the effective time, a message explains this.

**Partial data banner**: If any team's fetch fails, a banner lists affected teams; the rest of the schedule is still shown.

**No API key**: If no TBA key is configured, a prompt directs the user to `/config`.

---

## 5. TBA Response Caching

Responses are cached in `localStorage` for 5 minutes per full request URL. To force a refetch:
- Reload the app after the 5-minute TTL expires, **or**
- Open DevTools → Application → Local Storage → delete entries prefixed with `rushhour.tbaCache.`.

---

## 6. New Source Files (created in implementation)

| File | Purpose |
|------|---------|
| `src/domain/models/schedule.ts` | TypeScript types: `SubscribedTeam`, `SimulationClock`, `TBAEvent`, `TBAMatchSimple`, `ScheduledMatchEntry`, `UnifiedSchedule`, `TeamScheduleStatus`, `AppPersistentPreferences` |
| `src/domain/services/persistentPreferences.ts` | Read/write `rushhour.appPreferences.v1` in `localStorage` |
| `src/domain/services/tbaClient.ts` | Typed fetch wrapper with `X-TBA-Auth-Key` header and TTL cache |
| `src/domain/services/scheduleBuilder.ts` | Active-event detection, upcoming-match filter, merge + sort logic |
| `src/pages/SchedulePage/SchedulePage.tsx` | New route `/schedule` |
| `src/components/schedule/ScheduleEntry.tsx` | Single match row component |
| `src/components/schedule/ScheduleEmptyState.tsx` | Empty and no-event state message |

---

## 7. Running Tests

```bash
# Unit tests (new schedule service logic)
pnpm test

# Integration tests (Config page sim clock + subscribed teams)
pnpm test -- tests/integration/

# E2E smoke tests (schedule page renders, config persists)
pnpm test:e2e
```

New test files expected from implementation:
- `tests/unit/scheduleBuilder.test.ts`
- `tests/unit/persistentPreferences.test.ts`
- `tests/unit/tbaClient.test.ts`
- `tests/integration/schedule-page.test.tsx`
- `tests/e2e/schedule.spec.ts`

---

## 8. Key Design Constraints (from Constitution)

| Principle | Application |
|-----------|-------------|
| Static-First | TBA API called from browser; no proxy. API key in `localStorage`. |
| Responsive | Schedule page works from 320px; match list reflows on mobile. |
| Performance & Feedback | Loading indicator during TBA fetches; cached responses for fast re-renders. |
| Code Quality | `scheduleBuilder.ts` contains pure functions only; no DOM or React dependencies. |
