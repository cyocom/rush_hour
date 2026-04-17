# Quickstart: Hide Offline YouTube Streams

**Feature**: 005-hide-offline-youtube-streams  
**Date**: 2026-04-17

---

## What Is Being Built

Add availability-aware stream selection on the Watch page:
1. Probe YouTube stream availability.
2. Hide offline YouTube options when at least one stream is online.
3. If none are online, show all streams and flag them as offline/unknown.
4. Provide status messaging for offline fallback and stale probe results.

---

## New Files

| File | Purpose |
|------|---------|
| src/domain/services/streamAvailability.ts | Resolve per-webcast availability status for YouTube streams |
| tests/unit/streamAvailability.test.ts | Unit tests for probe normalization and failure handling |

---

## Modified Files

| File | Change |
|------|--------|
| src/domain/models/schedule.ts | Add availability fields to `WebcastOption` |
| src/domain/services/watchPage.ts | Attach availability, compute visible mode, preserve selection fallback |
| src/pages/WatchPage/WatchPage.tsx | Render mode-driven selector and panel status messaging |
| src/components/stream/WebcastSelector.tsx | Add status badges for fallback mode |
| src/components/stream/WebcastPanel.tsx | Add offline fallback and stale-status warning messaging |
| tests/unit/watchPage.test.ts | Add filtering/fallback cases |
| tests/integration/watch-page.test.tsx | Add rendered badge/message checks |
| tests/e2e/watch.spec.ts | Validate visible behavior in full flow |

---

## Implementation Order

1. Extend webcast model in `schedule.ts`.
2. Implement `streamAvailability.ts` and unit tests.
3. Update `watchPage.ts` to compute availability-aware visible set.
4. Update `WatchPage.tsx` wiring for mode, messaging, and selection continuity.
5. Update stream UI components for badges and fallback messages.
6. Add/adjust integration and e2e tests.

---

## Verification Checklist

- [ ] `pnpm test -- watchPage`
- [ ] `pnpm test -- streamAvailability`
- [ ] `pnpm test -- watch-page`
- [ ] `pnpm test:e2e -- watch`
- [ ] Mixed status scenario: only online streams shown when any online exists
- [ ] No-online scenario: all streams shown with offline/unknown flags
- [ ] Selected stream goes offline: user sees status feedback and can recover without reload
- [ ] Probe failure scenario: stream list still usable and stale-status warning appears
