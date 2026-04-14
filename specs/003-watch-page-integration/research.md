# Research: Watch Page Live Integration

**Feature Branch**: `003-watch-page-integration`  
**Date**: 2026-04-13

---

## R-001: TBA API v3 — Webcast Data Structure

**Question**: Which TBA endpoint returns webcast data, and what fields does it provide?

**Decision**: Use `/event/{event_key}` (full event detail endpoint), not `/event/{event_key}/simple`. The full response includes a `webcasts` array absent from the simple variant.

**Rationale**: The `/team/{team_key}/events/{year}/simple` call used for active event detection returns `TBAEvent` without webcasts. A separate one-shot call to `/event/{event_key}` for each active event's detail is required to obtain the `webcasts` array. Since we already know the event key after `findActiveEvent()`, this is a straightforward sequential fetch.

**TBA webcast object shape** (from TBA API v3 spec):
```ts
interface TBAWebcast {
  type: string   // e.g. "twitch" | "youtube" | "ustream" | "rtmp" | "iframe" | ...
  channel: string // e.g. "firstinspires" or a YouTube video ID
  file?: string   // present for some types; usually null
}
```

**Full event endpoint** also includes `city`, `state_prov`, `name`, `key` — all already in `TBAEvent`.

**Alternatives considered**:
- `/event/{event_key}/webcasts` — Does not exist as a standalone endpoint in TBA API v3; the webcasts are embedded in the full event response.
- Reusing the simple event response — Not possible; webcasts are not included.

---

## R-002: YouTube iframe Embed Pattern

**Question**: How do we produce a valid, embeddable YouTube URL from a TBA-provided channel value?

**Decision**: TBA returns YouTube webcasts with `channel` containing the **video ID** (not a channel handle). The embed URL is:
```
https://www.youtube.com/embed/{channel}?autoplay=1&rel=0
```

**Rationale**: FRC events are typically streamed as scheduled live events on YouTube. The TBA-registered value for `type: "youtube"` is always the raw video ID (11-character string), not a channel URL. No additional lookup is needed.

**Alternatives considered**: Using the YouTube Data API to resolve a channel to a live stream URL — rejected because it requires a separate API key and adds latency with no user-visible benefit.

---

## R-003: Twitch iframe Embed Pattern

**Question**: How do we produce a valid, embeddable Twitch URL and what parent-domain requirement exists?

**Decision**: Twitch requires an embed URL in this form:
```
https://player.twitch.tv/?channel={channel}&parent={window.location.hostname}&autoplay=true
```
The `parent` parameter is mandatory for Twitch embeds in iframes and must match the page's hostname. In local development (`localhost`), `parent=localhost` must be used. This is injected dynamically at runtime from `window.location.hostname`.

**Rationale**: Twitch's embed policy enforces the `parent` query parameter to prevent clickjacking. Without it, the embed shows an error. Dynamic injection from `window.location.hostname` handles both local dev and production domains with zero configuration.

**Alternatives considered**: Hardcoding the hostname — brittle across environments; rejected.

---

## R-004: Webcast Liveness Validation

**Question**: Should the app query external platform APIs to confirm a webcast is currently live before embedding it?

**Decision**: No. Treat all TBA-listed webcasts as candidates. Embed them and allow the native player UI (Twitch/YouTube) to surface offline state visually. No out-of-band liveness API calls.

**Rationale**:
- Twitch Helix API and YouTube Data API both require separate keys and add network round-trips.
- TBA organizers only register webcasts for events that will be streamed — stale entries are rare.
- Both Twitch and YouTube players natively display "stream is offline" or "video unavailable" states when not live.
- This matches the clarification answer from the spec session.

**Alternatives considered**: Twitch `GET /streams` via Helix API — rejected (extra API key required). YouTube `liveBroadcasts.list` — rejected (OAuth required for private broadcasts).

---

## R-005: Next Match Derivation Logic

**Question**: How should "next match" be computed from the unified schedule?

**Decision**: After the unified schedule entries are built (and sorted ascending by `predictedTime`), the "next match" is the first entry in the sorted list where `predictedTime > effectiveTimeUnix` **and** `subscribedTeamsInMatch.length > 0`. Entries with `predictedTime === null` are excluded from "next match" selection (they appear at the end of the schedule list but cannot be used for a countdown).

For the "in progress" state: if the first entry has `predictedTime <= effectiveTimeUnix` and `isPlayed === false`, it is shown as "In Progress". This uses existing `isPlayed` on `ScheduledMatchEntry`.

**Priority tie-break when multiple events**: The entry with the soonest `predictedTime` wins. If two entries share the exact same `predictedTime`, the one whose `subscribedTeamsInMatch` contains the team with the lowest index in the `subscribedTeams` preference array wins.

**Rationale**: Reuses existing `ScheduledMatchEntry` shape and sort order from `scheduleBuilder.ts`. No new domain logic required; `deriveNextMatch()` is a pure function over sorted entries.

---

## R-006: Default Webcast Selection

**Question**: When multiple webcasts are available across active events, how is the default chosen?

**Decision**: The default webcast is the one belonging to the event that contains the next upcoming match (per R-005 derivation). If that event has multiple webcasts, the first in the TBA-provided array is used. If there is no "next match" but webcasts exist, fall back to the event of the highest-priority subscribed team that has an active event.

**Rationale**: Matches the clarification answer: "the first webcast for the next match of any subscribed team, using the priority logic for any conflicts." Keeps default selection causally tied to the most operationally relevant piece of information on the watch page.

---

## R-007: Shared Data-Loading Pattern — Avoiding SchedulePage Duplication

**Question**: SchedulePage already fetches events, matches, and builds the unified schedule. How do we reuse this without copy-pasting?

**Decision**: Extract the data-loading logic into a new service module `src/domain/services/watchPage.ts`. This module exports:
- `useWatchPageData()` — a React hook that wraps the async fetch-and-build pipeline (events → active event → matches → schedule entries + webcasts) and returns a typed result state.
- `deriveNextMatch(entries, subscribedTeams, effectiveUnix)` — pure function.
- `buildWebcastOptions(activeEvents, fetchedDetailMap)` — pure function that assembles `WebcastOption[]`.

SchedulePage keeps its own inline `loadSchedule()` for now (its loading logic has SchedulePage-specific UX needs like day grouping and collapse state). The WatchPage uses `useWatchPageData()`.

**Rationale**: Doesn't force SchedulePage to be refactored as part of this feature, but avoids copy-paste into WatchPage. Constitution I (Code Quality First) satisfied by isolating the new hook.

**Alternatives considered**: Refactoring SchedulePage to also use the new hook — deferred to a future cleanup task; not required for correctness of this feature.

---

## R-008: Unsupported Webcast Platform Handling

**Question**: What happens when TBA returns a webcast with type other than "twitch" or "youtube"?

**Decision**: Show a "Stream provider not supported" fallback state inside the stream panel area, with a best-effort external link. For `type: "twitch"` and `type: "youtube"` the link is constructed deterministically from `channel`. For all other types, if `file` is non-null it is used as the link; otherwise a link to the TBA event page (`https://www.thebluealliance.com/event/{event_key}`) is used.

**Rationale**: Matches clarification answer. Twitch and YouTube are the only platforms in practice for FRC events; the fallback is a safety net.

---

## R-009: Conflict Detection on Watch Page

**Question**: Should the watch page re-implement count logic or reuse `computeConflictMatchKeys` from SchedulePage?

**Decision**: Move `computeConflictMatchKeys` from SchedulePage into `scheduleBuilder.ts` (or the new `watchPage.ts`) so both pages can call it. The WatchPage derives conflicts directly from `schedule.entries` rather than from mock `MatchWindow` data.

The existing `ConflictList` component accepts `MatchConflict[]` (from `watch.ts` model). A lightweight adapter function `toMatchConflicts(conflictKeys, entries)` converts `Set<string>` + `ScheduledMatchEntry[]` → `MatchConflict[]` for rendering.

**Rationale**: Eliminates mock data dependency per FR-009 and FR-013. Reuses proven conflict detection logic.
