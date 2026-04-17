# UI Contract: Hide Offline YouTube Streams

**Feature**: 005-hide-offline-youtube-streams  
**Date**: 2026-04-17

---

## Overview

This contract defines watch page behavior for stream selection when YouTube stream availability varies.

Primary UX goals:
- Prefer currently online streams when any exist.
- Avoid empty selection lists when none are online.
- Clearly flag offline states and preserve user recoverability.

---

## 1. Webcast Selector Contract

### Inputs

`WebcastSelector` continues to receive ordered webcast options, with each option carrying availability metadata.

```ts
interface WebcastSelectorProps {
  webcasts: WebcastOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  mode: 'online-only' | 'fallback-show-all'
}
```

### Rendering Rules

| Condition | Behavior |
|-----------|----------|
| `mode === 'online-only'` | Render only online options in selector pills |
| `mode === 'fallback-show-all'` | Render all options and show offline/unknown badges |
| `webcasts.length <= 1` | Keep current condensed behavior (no tablist) |

### Badge Rules

| Availability | Badge text |
|--------------|------------|
| `online` | Live |
| `offline` | Offline |
| `unknown` | Status unknown |

Badges must be visible in text (not color-only semantics).

---

## 2. Stream Panel Contract

### Inputs

`WebcastPanel` remains primary embed area and receives state-aware messaging fields.

```ts
interface WebcastPanelProps {
  webcast: WebcastOption | null
  hasActiveEvents: boolean
  overlayInfo?: StreamOverlayInfo | null
  showOfflineFallbackMessage?: boolean
  showStaleStatusWarning?: boolean
}
```

### Message Rules

| Condition | Message |
|-----------|---------|
| `showOfflineFallbackMessage === true` | "No streams are currently online. Showing available streams marked offline." |
| `showStaleStatusWarning === true` | "Some stream statuses may be stale." |
| `webcast === null && hasActiveEvents` | Keep existing no-webcast messaging |

---

## 3. Watch Page Composition Contract

### Derived Visibility Policy

`WatchPage` computes a visible webcast set for the currently shown event:
- Build event-scoped options.
- Evaluate availability.
- Apply mode rules.

### Selection Continuity

| Condition | Required behavior |
|-----------|-------------------|
| Current selected webcast remains visible | Preserve selection |
| Selected webcast becomes hidden by online-only filter | Re-select first visible option and surface status-change note |
| No options visible | Set selected webcast to null |

---

## 4. Accessibility and Responsiveness

- Selector pills and status badges must remain readable at mobile widths.
- Status indicators use semantic text labels.
- Dynamic status updates should not trap focus or cause layout shifts that break keyboard navigation.

---

## 5. Out of Scope

- Manual per-provider visibility toggles.
- Persistent user settings for status filter behavior.
- Non-YouTube live-state probing logic.
