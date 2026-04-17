# Research: Hide Offline YouTube Streams

**Feature**: 005-hide-offline-youtube-streams  
**Date**: 2026-04-17  
**Status**: Complete

---

## 1. Determining YouTube Stream Availability in a Static Client

### Decision
Use a browser-side YouTube availability probe service that classifies each YouTube webcast as `online`, `offline`, or `unknown`, then feed that status into webcast selection logic.

### Rationale
Current TBA event webcast metadata provides channel/video identifiers but not real-time live status. Since the project is static-first and cannot depend on a backend, availability must be inferred in the client and treated as best-effort.

### Approach
- Probe only YouTube webcast options.
- Keep Twitch and unsupported providers as `unknown` availability (always visible).
- Apply a short timeout to avoid blocking watch rendering.
- Treat probe failures as `unknown` and keep options visible in fallback mode.

### Alternatives considered
- YouTube Data API v3 lookup with server key: rejected because it introduces backend/key-management requirements.
- Always hide YouTube streams with unknown status: rejected because it can remove all viewing options and conflicts with fallback requirement.
- Manual user toggles for offline filtering: rejected because it adds control complexity and does not satisfy default behavior requirements.

---

## 2. Selection Behavior Rules

### Decision
Use a two-mode visibility policy:
1. If at least one stream is `online`, show only online streams in the primary selector.
2. If no stream is `online`, show all streams with offline/unknown flags.

### Rationale
This preserves the original intent (avoid dead links when online options exist) while implementing clarified fallback behavior (never show an empty selector solely due to status filtering).

### User feedback contract
- Show explicit message when no streams are online.
- Keep stream pills available in fallback mode with status badges.
- If selected stream transitions to offline, show status feedback and preserve recoverability.

---

## 3. Refresh and Failure Strategy

### Decision
Run availability normalization inside existing watch refresh cadence (60s) and do not create additional rapid polling loops.

### Rationale
The watch page already refreshes core data every minute. Integrating status updates into that cycle avoids redundant network traffic and keeps state updates predictable.

### Failure handling
- Probe timeout/fetch failure => `unknown` status.
- If all statuses are non-online => fallback show-all mode.
- Display non-blocking stale-status message when any probe fails.

---

## 4. Test Strategy

### Decision
Split verification into three layers:
- Unit: availability normalization and visibility policy edge cases.
- Integration: Watch page rendering for mixed, all-offline, and probe-failure scenarios.
- E2E: user-visible behavior in stream selector and panel messaging.

### Rationale
Most risk sits in status classification and conditional filtering; unit tests catch logic regressions quickly while integration/e2e confirms user-visible outcomes.

---

## 5. Open Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube probe semantics vary by stream state | Misclassification | Keep `unknown` as non-destructive and fallback to show-all when none online |
| Extra probing delays first paint | UX lag | Render schedule immediately; update statuses asynchronously |
| Frequent status flapping near stream start | Selector churn | Preserve selected webcast where possible and surface status-change feedback |
