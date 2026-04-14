# Phase 0 Research: Config Page and Schedule View

## Decision 1: Persistence Layer Upgrade

- **Decision**: Use `localStorage` (not `sessionStorage`) for subscribed teams and simulation clock settings.
- **Rationale**: FR-003 and FR-006 explicitly require settings to survive browser tab/session closure. The existing `sessionStorage` pattern (from feature 001) only persists within a single browser session. A new `persistentPreferences` service will mirror the shape of the existing `sessionPreferences` service but target `localStorage`.
- **Alternatives considered**: Keeping `sessionStorage` for both features was rejected because the spec explicitly calls for cross-session durability. A backend/database store was rejected to maintain Static-First Architecture (Principle III).

---

## Decision 2: TBA API Authentication Model

- **Decision**: Require the user to supply their own TBA API Read key via the Config page; store it in `localStorage`.
- **Rationale**: The TBA API v3 requires `X-TBA-Auth-Key` on every request. Because the app is a static SPA with no server-side runtime, a proxy is not possible without violating Principle III. Hardcoding a key exposes it to all users of the app indefinitely. Allowing the user to paste their own read-only key from https://www.thebluealliance.com/account is the safest, most sustainable approach for a personal/team deployment.
- **Alternatives considered**: Hardcoding a shared read key was rejected (key exposure risk and violation of secure coding practices). A CORS proxy was rejected (violates Static-First). Vite environment variable injection at build time was considered but rejected because it still exposes the key in the bundle.

---

## Decision 3: TBA API Endpoints

- **Decision**: Use the following TBA v3 REST endpoints called directly from the browser.
  - `GET /team/{team_key}/events/{year}/simple` — fetch all events for a team in the season year, filtered client-side for active event at effective business time.
  - `GET /event/{event_key}/matches/simple` — fetch simplified match list for an event; `predicted_time` (Unix timestamp) used for sorting and upcoming-filter.
- **Rationale**: The `/simple` variants return a smaller payload (no score breakdown), sufficient for schedule display. Fetching per-team events then per-event matches gives us full control over the filtering logic.
- **Alternatives considered**: `GET /team/{team_key}/matches/{year}` was considered but returns all matches across all events without event context needed for active-event gating. The full `Match` schema was rejected for initial display (overkill payload).

---

## Decision 4: Active Event Detection

- **Decision**: A team's "currently active event" is determined client-side by checking if `effective_business_time` falls within `[event.start_date, event.end_date]` (inclusive, date-only comparison using `date-fns`).
- **Rationale**: TBA does not expose a "is this event happening right now?" flag directly; events carry `start_date` and `end_date` strings (`YYYY-MM-DD`). Comparing the effective date (from simulation clock or real-time) against this window is reliable and deterministic.
- **Alternatives considered**: Using `event_type` to filter only Regional/District events was considered but rejected as over-constraining (would exclude Championship events).

---

## Decision 5: TBA Response Caching

- **Decision**: Cache TBA API responses in `localStorage` with a 5-minute TTL. Cache is keyed by full request URL. Stale entries are refreshed transparently on next load.
- **Rationale**: Prevents redundant network calls when the user navigates away and returns to the schedule page within the same session. Aligns with Principle IV (Performance & Feedback) by keeping subsequent loads fast.
- **Alternatives considered**: No caching was rejected (unnecessary API traffic and slow re-loads). Full service worker caching was rejected as over-engineered for this scope. `sessionStorage` cache was rejected because localStorage cache survives reloads within reasonable TTL.

---

## Decision 6: Upcoming Match Filter

- **Decision**: A match is "upcoming" if `predicted_time > effective_business_time_unix`. Matches with `predicted_time === null` are included with a last-resort ordering based on `comp_level` sort order and `match_number`; they display a "time unavailable" indicator.
- **Rationale**: The spec requires upcoming matches only (FR-009). Using `predicted_time` is preferred over TBA's `time` field because `predicted_time` is TBA's best current estimate during an event; `time` may be the original scheduled time. Matches with no predicted time must still appear per the edge cases in the spec.
- **Alternatives considered**: Using `actual_time` was rejected (only set after the match has been played, always in the past). Filtering null-time matches entirely was rejected per spec edge case.

---

## Decision 7: Simulation Clock Storage Format

- **Decision**: Store simulation clock as `{ enabled: boolean; simulatedISOString: string | null }` in `localStorage` under key `rushhour.simulationClock.v1`.
- **Rationale**: ISO 8601 string format preserves timezone context and is natively sortable. `date-fns` (already in dependencies) converts this to Unix for API comparisons without additional libraries.
- **Alternatives considered**: Storing as a Unix timestamp was rejected (loses timezone readability during debugging). A separate "simulated offset" from real time was rejected (over-complex for no benefit).

---

## Decision 8: TBA Team Key Format

- **Decision**: TBA team keys use the format `frc{teamNumber}` (e.g., team 254 → `frc254`). The system constructs keys from the integer team numbers stored in subscribed team records.
- **Rationale**: TBA API requires this key format for all `/team/{team_key}/...` endpoint calls. The construction is trivial (`\`frc${teamId}\``) and does not require a separate lookup.
- **Alternatives considered**: No alternatives; this is TBA's specified format.

---

## Decision 9: Partial Data and Error Handling

- **Decision**: Each subscribed team's event/match fetch is independent. A failed fetch for one team logs an error and marks that team as `status: 'error'`; the schedule renders available teams normally and shows a banner listing teams with fetch failures.
- **Rationale**: FR-012 requires schedule to show available results and indicate incomplete coverage. Failing the entire schedule when one team's data is unavailable is too disruptive.
- **Alternatives considered**: Retrying with exponential backoff was considered but deferred as over-engineered for a competition-day tool.
