# Data Model: Hide Offline YouTube Streams

**Feature**: 005-hide-offline-youtube-streams  
**Date**: 2026-04-17

---

## Entities

### WebcastOption (extended existing model)

Existing watch webcast option model gains availability metadata.

```ts
type StreamAvailability = 'online' | 'offline' | 'unknown'

interface WebcastOption {
  id: string
  platform: 'twitch' | 'youtube' | 'unsupported'
  channel: string
  eventKey: string
  eventName: string
  label: string
  embedUrl: string | null
  externalUrl: string
  availability: StreamAvailability
  availabilityCheckedAt: string | null
}
```

Notes:
- `availability` defaults to `unknown` for non-YouTube providers.
- `availabilityCheckedAt` is ISO timestamp for diagnostics and stale-status messaging.

---

### AvailabilityProbeResult (new service output)

Represents normalized status for a single YouTube webcast probe.

```ts
interface AvailabilityProbeResult {
  webcastId: string
  availability: 'online' | 'offline' | 'unknown'
  checkedAt: string
  reason: 'probe-success' | 'probe-timeout' | 'probe-error' | 'unsupported-provider'
}
```

---

### VisibleWebcastSet (derived view model)

Computed selection output used by Watch page and stream components.

```ts
interface VisibleWebcastSet {
  mode: 'online-only' | 'fallback-show-all'
  options: WebcastOption[]
  hasAnyOnline: boolean
  hasProbeFailures: boolean
}
```

Rules:
- `online-only` when any webcast has `availability === 'online'`.
- `fallback-show-all` when none are online.

---

## State Transitions

### Availability Classification

```
Unclassified
  -> Probe succeeds and indicates live     => online
  -> Probe succeeds and indicates not live => offline
  -> Probe timeout or error                => unknown
```

### Selector Visibility Mode

```
Evaluate current event webcast statuses
  -> hasAnyOnline = true  => mode = online-only; hide offline YouTube entries
  -> hasAnyOnline = false => mode = fallback-show-all; show all entries with status flags
```

### Selected Stream Continuity

```
Current selected webcast exists in next visible set
  -> keep selection
Current selected webcast removed by online-only filter
  -> select first visible webcast and show status-change feedback
No visible options at all
  -> null selection and empty panel messaging
```

---

## Service Interface

### src/domain/services/streamAvailability.ts (new)

```ts
interface StreamAvailabilityService {
  resolveWebcastAvailability(webcasts: WebcastOption[]): Promise<AvailabilityProbeResult[]>
}
```

Expected behavior:
- Probe YouTube entries only.
- Return deterministic result object per input webcast.
- Never throw for partial failures; encode failures as `unknown`.

---

## Affected Existing Models

| File | Change |
|------|--------|
| src/domain/models/schedule.ts | Add `StreamAvailability` type and availability fields on `WebcastOption` |
| src/domain/services/watchPage.ts | Apply availability results and compute `VisibleWebcastSet` |
| src/pages/WatchPage/WatchPage.tsx | Use derived mode to render selector/panel messaging |
