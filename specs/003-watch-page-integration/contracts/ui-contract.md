# UI Contract: Watch Page Live Integration

**Feature Branch**: `003-watch-page-integration`  
**Date**: 2026-04-13

This document defines the public interface contracts for all new and materially changed UI components introduced in this feature.

---

## Component: `WebcastPanel`

**File**: `src/components/stream/WebcastPanel.tsx`  
**Replaces**: `MockStreamPanel`

### Props

```ts
interface WebcastPanelProps {
  webcast: WebcastOption | null
  // null → "no webcast available" state or "no active event" state
  // non-null → attempt embed or show unsupported-platform fallback
}
```

### States

| State | Trigger | Visual |
|-------|---------|--------|
| No active event | `webcast === null`, no active events for any subscribed team | Dark panel with text: "No active event found for your subscribed teams" |
| No webcast | `webcast === null`, active events exist but none have webcasts | Dark panel with text: "No webcast available" + TBA event external link |
| Embedding — Twitch | `webcast.platform === 'twitch'` | `<iframe>` with `embedUrl`; full `aspect-ratio: 16/9`; height: `clamp(420px, 56vh, 840px)` |
| Embedding — YouTube | `webcast.platform === 'youtube'` | `<iframe>` with `embedUrl`; same sizing as Twitch |
| Unsupported platform | `webcast.platform === 'unsupported'` | Message: "Stream provider not supported" + external link to stream |

### iframe Attributes

```html
<iframe
  src="{webcast.embedUrl}"
  allow="autoplay; fullscreen"
  allowfullscreen
  title="{webcast.label}"
  style="border:0; width:100%; aspect-ratio:16/9;"
/>
```

### Accessibility

- `<iframe>` has a `title` attribute equal to `webcast.label`.
- Fallback states use a `<p>` with descriptive text plus an `<a>` with `target="_blank" rel="noopener noreferrer"`.

---

## Component: `WebcastSelector`

**File**: `src/components/stream/WebcastSelector.tsx`  
**New component**

### Props

```ts
interface WebcastSelectorProps {
  webcasts: WebcastOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}
```

### Behaviour

- Hidden when `webcasts.length <= 1`.
- Renders a horizontal pill/tab row above the stream panel when `webcasts.length >= 2`.
- Each pill shows `webcast.label` (e.g. `"2026 TX Houston · Twitch"`).
- Active pill uses primary brand colour (`rgb(150 29 55)`) background; inactive pills use surface styling.
- Overflow scrolls horizontally on narrow viewports; no wrapping.

### Accessibility

- Rendered as `<div role="tablist">` with each pill as `<button role="tab" aria-selected={isSelected}>`.

---

## Component: `NextMatchBar`

**File**: `src/components/watch/NextMatchBar.tsx`  
**New component**

### Props

```ts
interface NextMatchBarProps {
  next: NextMatchInfo
  // next.status === 'none' → component renders null (hidden)
}
```

### States

| Status | Visual cue | Label |
|--------|-----------|-------|
| `none` | Hidden — component returns `null` | — |
| `upcoming` | Neutral style (no special colour) | "Next: {matchLabel} · {teams} · in {N} min" |
| `soon` | Elevated — amber/warning accent | "Up soon: {matchLabel} · {teams} · in {N} min" |
| `in-progress` | Elevated — primary brand colour pulse | "Now playing: {matchLabel} · {teams}" |

### Layout

- Full-width bar, positioned between the `WebcastSelector` row and the `<WebcastPanel>` iframe.
- Height: `auto`; padding `12px 20px`.
- Stacks to two lines on mobile (`< 540 px`).

### Accessibility

- Uses `aria-live="polite"` to announce status changes.
- In-progress state adds `aria-label="Match in progress"`.

---

## Component: `UpcomingAlertsList` (updated interface)

**File**: `src/components/alerts/UpcomingAlertsList.tsx`  
**Change**: No props change; data source changes from mock `MatchWindow`-derived alerts to `ScheduledMatchEntry`-derived alerts built in `useWatchPageData`.

The existing `UpcomingMatchAlert[]` prop type is retained. The watch page now passes alerts built from `ScheduledMatchEntry` data rather than from `loadMockMatchWindows()`.

---

## Component: `ConflictList` (updated interface)

**File**: `src/components/alerts/ConflictList.tsx`  
**Change**: Same as `UpcomingAlertsList` — props unchanged; data source changes from mock to live.

---

## Hook: `useWatchPageData`

**File**: `src/domain/services/watchPage.ts`

```ts
function useWatchPageData(): WatchPageState
```

**Contract**:
- Calls TBA API on mount (no arguments).
- Reads `subscribedTeams`, `simulationClock`, and `tbaApiKey` from `localStorage` via `readPersistentPreferences()`.
- Returns `WatchPageState` (see data-model.md).
- Does not poll; fires once on mount. Re-render by navigating away and back.

---

## Pure Function: `deriveNextMatch`

**File**: `src/domain/services/watchPage.ts`

```ts
function deriveNextMatch(
  entries: ScheduledMatchEntry[],
  effectiveUnix: number,
): NextMatchInfo
```

**Contract**:
- `entries` must be sorted ascending by `predictedTime` (nulls last) — as produced by `mergeAndSort`.
- Pure function; no side effects.
- Returns `{ status: 'none', entry: null, minutesUntil: null }` when no qualifying entry exists.

---

## Pure Function: `buildWebcastOptions`

**File**: `src/domain/services/watchPage.ts`

```ts
function buildWebcastOptions(
  eventDetails: TBAEventDetail[],
  hostname: string,
): WebcastOption[]
```

**Contract**:
- Flattens `webcasts` arrays from all event details.
- Deduplicates by `type + channel` combination.
- Constructs `embedUrl` and `externalUrl` per rules in data-model.md.
- Returns `WebcastOption[]` ordered: active event for soonest next match first, then remaining events in priority order.
- `hostname` is passed as argument (not read from `window`) so the function is testable in Node/jsdom.

---

## Retired Component

**`MockStreamPanel`** (`src/components/stream/MockStreamPanel.tsx`) is retired by this feature. It may be deleted or left in place with no imports. No existing tests outside `WatchPage` reference it.
