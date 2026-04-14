# Feature Specification: Watch Page Live Integration

**Feature Branch**: `003-watch-page-integration`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Okay, now we need to integrate everything together for the watch page. At a high level, we need to get the webcasts for the event and show that webcast when the match is up for the team. We also need to integrate the 'next match' bar as well, and the alerts for conflicts etc."

## Clarifications

### Session 2026-04-13

- Q: How should the app determine which TBA-listed webcasts are "live" right now? → A: Treat all TBA-listed webcasts as candidates; embed them and let the player surface an offline state. No separate platform liveness API calls.
- Q: What UI pattern should the webcast toggle use? → A: Pill/tab row above the stream panel; each entry labeled by stream title. Since TBA provides no stream title, labels fall back to event name + platform (see Q5).
- Q: When the watch page first loads with multiple webcasts, which is selected by default? → A: The webcast for the event hosting the soonest upcoming match across all subscribed teams; conflicts between teams at different events are resolved by subscribed team priority order.
- Q: What should the stream panel show when a webcast platform does not support embedding? → A: Twitch and YouTube both support embedding and are the only expected platform types. Any other platform type shows a "stream provider not supported" state with an external link to the stream.
- Q: How should each webcast be labeled in the toggle when TBA provides no stream title? → A: Event name + platform type (e.g. "2026 TX Houston · Twitch").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Live Webcast for Subscribed Team's Event (Priority: P1)

As a drive team member or scout watching a competition, I want the watch page to automatically surface the webcast for my subscribed teams' active events so I don't have to hunt for stream links manually.

**Why this priority**: The webcast is the primary content of the watch page. Without a real stream source, all other watch-page features lack meaningful context.

**Independent Test**: Can be fully tested by having at least one subscribed team with an active event that has a registered webcast, loading the watch page, and verifying the correct webcast source is displayed (or a graceful fallback when no webcast is registered).

**Acceptance Scenarios**:

1. **Given** a subscribed team has an ongoing event with a registered webcast, **When** the user opens the watch page, **Then** the webcast for that event is fetched from TBA and displayed in the stream panel area.
2. **Given** an active event has no registered webcast, **When** the watch page loads, **Then** the stream panel shows a "no webcast available" state with an external link to the event page on The Blue Alliance.
3. **Given** multiple subscribed teams have events simultaneously with different webcasts, **When** the watch page loads, **Then** the system defaults to the webcast for the event hosting the soonest upcoming match across all subscribed teams (priority-order used to break ties), and provides a pill/tab row above the stream panel to toggle between all available webcasts labeled as "Event Name · Platform".
4. **Given** no subscribed teams have an active event, **When** the watch page loads, **Then** the stream panel shows an empty state explaining no current events are found.

---

### User Story 2 - See the "Next Match" Bar for Tracked Teams (Priority: P1)

As a drive team member, I want a persistent "next match" bar that shows my very next upcoming match for subscribed teams so I always know how much time I have before I need to be ready.

**Why this priority**: Knowing the next match is the most time-sensitive information a team needs during a competition day; it drives preparation and field staging.

**Independent Test**: Can be fully tested by setting a simulated time before an event's scheduled match, loading the watch page, and verifying the bar correctly identifies and displays the soonest upcoming match for any subscribed team.

**Acceptance Scenarios**:

1. **Given** at least one subscribed team has an upcoming match at the effective time, **When** the watch page renders, **Then** a "next match" bar appearing above the stream panel shows the match label, team number, predicted time, and a countdown or absolute time display.
2. **Given** the next match is within 10 minutes, **When** the bar renders, **Then** the urgency level is visually elevated (distinct styling) compared to matches further away.
3. **Given** a subscribed team's match is currently in progress (predicted time has passed and no actual result yet), **When** the bar renders, **Then** it shows the match as "in progress" rather than upcoming.
4. **Given** no upcoming matches exist for all subscribed teams, **When** the watch page loads, **Then** the next match bar is hidden or shows a "no upcoming matches" state.

---

### User Story 3 - Conflict Alerts Sourced from Live Schedule Data (Priority: P2)

As a scout or multi-team follower, I want conflict alerts on the watch page to reflect real upcoming schedule data from TBA rather than mock matches so the warnings are actionable and accurate.

**Why this priority**: Conflict detection is only useful when it reflects real data; mock-based conflicts provide no operational value.

**Independent Test**: Can be fully tested by subscribing to two teams competing at overlapping times in a real or simulated event window, loading the watch page, and confirming a conflict notice accurately names both teams and the overlapping time window.

**Acceptance Scenarios**:

1. **Given** two or more subscribed teams have matches predicted within a 5-minute window, **When** the watch page loads, **Then** the conflict panel flags the overlap with the team keys and predicted match times involved.
2. **Given** no subscribed teams have overlapping upcoming matches, **When** the watch page loads, **Then** the conflict panel is hidden or shows a clear "no conflicts" state rather than stale mock data.
3. **Given** TBA data fetch fails for one team's event, **When** the watch page loads, **Then** conflicts are computed from available data, and the user is shown a warning that coverage may be incomplete.

---

### User Story 4 - Upcoming Alerts List Sourced from Live Schedule Data (Priority: P2)

As a viewer following subscribed teams, I want the upcoming alerts list to reflect real matches from TBA so I have a reliable, time-ordered list of what is coming next.

**Why this priority**: The alerts list is the secondary watch-page navigation aid; it should reflect the same unified schedule computed for the schedule page but scoped to upcoming matches relative to effective time.

**Independent Test**: Can be fully tested by navigating to the watch page with real or simulated TBA data and confirming the upcoming alerts order matches predicted times from TBA.

**Acceptance Scenarios**:

1. **Given** subscribed teams have upcoming matches, **When** the watch page loads, **Then** each match is shown as an alert entry with match label, predicted time, and urgency level derived from time-to-match.
2. **Given** the simulation clock is active, **When** the watch page computes alerts, **Then** urgency and ordering are computed relative to the simulated time, not the real clock.
3. **Given** a subscribed team's match data has no predicted time, **When** that match is included in the list, **Then** it appears at the bottom with a missing-time indicator.

---

### Edge Cases

- A subscribed team has an active event but TBA has not yet posted webcasts — show "no webcast" fallback without blocking other data.
- Multiple events share the same webcast channel — display deduplicated.
- The simulated clock is set to a time between events — no active events found; show appropriate empty states for stream and next-match bar.
- TBA API key is not configured — all data-dependent sections show a "configure API key" prompt.
- One subscribed team's event data fails to load while others succeed — partial data warning shown; available data still rendered.
- A webcast's platform type is neither Twitch nor YouTube — show a "stream provider not supported" screen with an external link to the stream URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The watch page MUST fetch webcast information for each active event associated with subscribed teams using the TBA API.
- **FR-002**: On initial load, the watch page MUST default to displaying the webcast for the event hosting the soonest upcoming match across all subscribed teams; when multiple subscribed teams' events tie for soonest match, the highest-priority subscribed team's event webcast is used.
- **FR-003**: When multiple webcasts are available across active events, the user MUST be able to toggle between them using a pill/tab row displayed above the stream panel; each option MUST be labeled as "Event Name · Platform" (e.g. "2026 TX Houston · Twitch").
- **FR-004**: When an active event has no webcast registered, the stream panel MUST show a "no webcast available" fallback state with an external link to the event page on The Blue Alliance.
- **FR-014**: When a webcast's platform type is not Twitch or YouTube, the stream panel MUST display a "stream provider not supported" state with an external link to the stream.
- **FR-005**: The watch page MUST display a "next match" bar identifying the single soonest upcoming match across all subscribed teams.
- **FR-006**: The "next match" bar MUST show match label, team identifier(s), predicted time, and urgency indicator.
- **FR-007**: The "next match" bar MUST use urgency levels consistent with the rest of the application: normal, soon (≤10 min), and in-progress.
- **FR-008**: Upcoming match alerts on the watch page MUST be derived from the same unified schedule data used by the schedule page, scoped to upcoming matches only.
- **FR-009**: Conflict alerts on the watch page MUST be computed from live TBA schedule data, not mock data.
- **FR-010**: The watch page MUST respect the simulation clock when computing urgency, match timing, and active event selection.
- **FR-011**: When the TBA API key is absent, all data-dependent sections MUST surface a prompt directing the user to configure it in settings.
- **FR-012**: When one or more team event fetches fail, available data MUST still be rendered and a partial-data warning MUST be shown.
- **FR-013**: Mock match data MUST be removed from the watch page's data pipeline; only TBA-sourced data is used in production.

### Key Entities

- **Webcast**: A live stream source associated with an event; has a channel type (Twitch, YouTube, etc.) and a channel identifier.
- **NextMatchBar**: A UI element summarizing the single nearest upcoming match for any subscribed team.
- **UpcomingAlert**: A time-ordered notification entry for an upcoming match involving at least one subscribed team, sourced from the unified schedule.
- **ConflictAlert**: A warning that two or more subscribed teams have matches predicted within a conflict window.
- **EffectiveTime**: The current real or simulated time used as the reference point for all match timing logic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with configured subscribed teams and a valid API key can open the watch page and see a live webcast source displayed within 3 seconds of the page becoming interactive.
- **SC-002**: The "next match" bar correctly identifies the soonest upcoming match for any subscribed team in 100% of test scenarios using simulated event data.
- **SC-003**: Conflict and alert sections display zero stale mock entries — all displayed data is traceable to TBA API responses or clear empty states.
- **SC-004**: All partial-failure scenarios (missing webcast, one team's data unavailable, no active events) are covered by automated tests with explicit expected outcomes.
- **SC-005**: Switching the simulated clock to a time that changes urgency levels causes visible UI updates to the next-match bar and alert entries without a page reload.

## Assumptions

- TBA API v3's event endpoint returns webcast information as part of the event detail response (or a dedicated `/event/{key}/simple` or webcast sub-path). Each webcast object provides `type` (platform identifier) and `channel` (handle), but no stream title.
- Only Twitch and YouTube webcasts are embedded; any other platform type shows a "stream provider not supported" state with an external link. No separate platform liveness API calls are made — the embed player surfaces offline state naturally.
- The unified schedule builder and `fetchTeamEvents`/`fetchEventMatches` services already created in spec 002 are the canonical data source for the watch page alerts and conflicts.
- The simulation clock persisted in `localStorage` is already accessible via `getEffectiveTime()` from `persistentPreferences.ts`.
- Only a single stream panel is shown at a time on the watch page; multi-stream side-by-side is out of scope.
- Webcast selection (when multiple are available) is a lightweight in-page control, not a separate settings page.
- The TBA API key is stored and retrieved from persistent preferences per the spec 002 implementation.
