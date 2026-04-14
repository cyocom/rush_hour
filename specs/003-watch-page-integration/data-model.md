# Data Model: Watch Page Live Integration

**Feature Branch**: `003-watch-page-integration`  
**Date**: 2026-04-13

---

## New / Extended Types

### `TBAWebcast` *(new — add to `src/domain/models/schedule.ts`)*

Raw webcast object returned by TBA API v3 `/event/{event_key}`.

```ts
export interface TBAWebcast {
  type: string     // "twitch" | "youtube" | "ustream" | "rtmp" | "iframe" | ...
  channel: string  // Twitch channel handle or YouTube video ID
  file?: string    // Optional; present on some types
}
```

**Source**: TBA API v3 — embedded in the full `/event/{event_key}` response (not available in `/simple`).

---

### `TBAEventDetail` *(new — add to `src/domain/models/schedule.ts`)*

Full event response from TBA; superset of `TBAEvent` (which comes from the simple endpoint). Only the `webcasts` field is required beyond what `TBAEvent` already provides.

```ts
export interface TBAEventDetail extends TBAEvent {
  webcasts: TBAWebcast[]
}
```

**Note**: `TBAEvent` is already defined in `schedule.ts` with `key`, `name`, `start_date`, `end_date`, `event_type`, `city`, `state_prov`. `TBAEventDetail` extends it with the `webcasts` array.

---

### `WebcastOption` *(new — add to `src/domain/models/schedule.ts`)*

Display-ready webcast entry used by `WebcastSelector` and `WebcastPanel`.

```ts
export type WebcastPlatform = 'twitch' | 'youtube' | 'unsupported'

export interface WebcastOption {
  id: string              // Unique: "{eventKey}:{type}:{channel}"
  platform: WebcastPlatform
  channel: string         // Raw channel value from TBA
  eventKey: string
  eventName: string
  label: string           // "Event Name · Platform" e.g. "2026 TX Houston · Twitch"
  embedUrl: string | null // null when platform === 'unsupported'
  externalUrl: string     // Always present; fallback link
}
```

**Derivation rules**:
- `platform`: `"twitch"` if `type === "twitch"`, `"youtube"` if `type === "youtube"`, else `"unsupported"`.
- `embedUrl` for Twitch: `https://player.twitch.tv/?channel={channel}&parent={hostname}&autoplay=true`
- `embedUrl` for YouTube: `https://www.youtube.com/embed/{channel}?autoplay=1&rel=0`
- `embedUrl` for unsupported: `null`
- `externalUrl` for Twitch: `https://www.twitch.tv/{channel}`
- `externalUrl` for YouTube: `https://www.youtube.com/watch?v={channel}`
- `externalUrl` for unsupported: `file` value if non-null, else TBA event URL `https://www.thebluealliance.com/event/{eventKey}`
- `label`: `"{eventName} · {platform[0].toUpperCase() + platform.slice(1)}"` — e.g. `"2026 TX Houston · Twitch"`
- Deduplication: two webcasts with the same `type` + `channel` across different events share the same stream; only the first (by event priority) is retained.

---

### `NextMatchInfo` *(new — add to `src/domain/models/schedule.ts`)*

Derived from the sorted `ScheduledMatchEntry[]`. Passed to `NextMatchBar`.

```ts
export type NextMatchStatus = 'upcoming' | 'soon' | 'in-progress' | 'none'

export interface NextMatchInfo {
  status: NextMatchStatus
  entry: ScheduledMatchEntry | null  // null when status === 'none'
  minutesUntil: number | null        // null when no predictedTime or status === 'none'
}
```

**Derivation rules** (from `deriveNextMatch(entries, effectiveUnix)`):
- `status: 'none'` — no entries or no entry with `subscribedTeamsInMatch.length > 0`
- `status: 'in-progress'` — first entry has `predictedTime !== null && predictedTime <= effectiveUnix && !isPlayed`
- `status: 'soon'` — first upcoming entry has `predictedTime` within 600 seconds (10 min) of `effectiveUnix`
- `status: 'upcoming'` — first upcoming entry has `predictedTime > effectiveUnix + 600`
- `minutesUntil`: `Math.floor((entry.predictedTime - effectiveUnix) / 60)` or `null`

---

### `WatchPageState` *(new — internal to `src/domain/services/watchPage.ts`)*

State shape returned by the `useWatchPageData()` hook.

```ts
export type WatchPageLoadStatus = 'idle' | 'loading' | 'done'

export interface WatchPageState {
  loadStatus: WatchPageLoadStatus
  schedule: UnifiedSchedule | null
  webcasts: WebcastOption[]
  selectedWebcastId: string | null
  noApiKey: boolean
  noSubscribedTeams: boolean
}
```

---

## Extended Types (existing — modified)

### `UnifiedSchedule` *(in `src/domain/models/schedule.ts` — unchanged)*

No structural changes. The `entries` array and `teamStatuses` are already sufficient for the watch page. The watch page simply reads `entries` for alerts, conflict detection, and next-match derivation.

---

## State Transitions

### `WatchPageState.loadStatus`

```
idle → loading → done
         ↑ triggered by useEffect on mount
```

- Transition to `noApiKey = true` or `noSubscribedTeams = true` bypasses `loading`.
- All fetch failures result in `done` with partial data (per FR-012).

### `selectedWebcastId`

- Set automatically on initial load to the webcast belonging to the event of the next upcoming match (R-006).
- User can override by clicking a pill in `WebcastSelector`.
- Not persisted across sessions (in-memory state only).

---

## Validation Rules

| Field | Rule |
|-------|------|
| `TBAWebcast.type` | Any string accepted; only `"twitch"` and `"youtube"` produce an embed |
| `TBAWebcast.channel` | Non-empty string required to generate an embed or external URL |
| `WebcastOption.id` | Must be unique within the `webcasts[]` array; duplicates dropped |
| `NextMatchInfo.minutesUntil` | Negative values clamped to `0` (≡ "in-progress") |
