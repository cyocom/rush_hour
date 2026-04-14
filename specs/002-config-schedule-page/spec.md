# Feature Specification: Config Page and Schedule View

**Feature Branch**: `[002-run-git-feature-hook]`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Lets start to get some of the functionality locked in, we can ignore the watch page for now. Lets focus on the config page, and a new page, the \"schedule\" page. The schedule page will have the upcoming matches for all teams we have subscribed to. We will pull these from the blue alliance api. no events are running today 4/13. So lets have a date/time select so we can simulate what day / time it is for buisness logic testing purposes. We will grab the current event for each team we are subscribed to (if it is currently happening) and then intersperse the matches into one schedule using the predicted match times from TBA."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Subscribed Teams (Priority: P1)

As a scouting lead, I can manage the list of subscribed teams on the configuration page so the app knows which teams to include in schedule building.

**Why this priority**: Team subscription is the foundation for all schedule behavior; without it, the schedule page has no meaningful data source.

**Independent Test**: Can be fully tested by adding, removing, and persisting subscribed teams on the configuration page and confirming the saved list is retained across page reloads.

**Acceptance Scenarios**:

1. **Given** a user is on the configuration page, **When** they add a valid team number to subscriptions, **Then** the team appears in the subscribed team list and is persisted.
2. **Given** a subscribed team is listed, **When** the user removes it, **Then** it is no longer included in subscriptions and is persisted as removed.
3. **Given** a user enters an invalid or duplicate team number, **When** they try to save, **Then** the system blocks the save and shows a clear validation message.

---

### User Story 2 - Simulate Date and Time (Priority: P1)

As a tester, I can set a simulated date and time so business logic can be validated even when no events are currently running in real time.

**Why this priority**: The feature is explicitly needed to test behavior on dates where no live events exist; without simulation control, schedule logic cannot be reliably validated.

**Independent Test**: Can be fully tested by selecting different date/time values and confirming all schedule calculations are based on the selected simulated time rather than the actual clock.

**Acceptance Scenarios**:

1. **Given** a user opens the configuration page, **When** they set a simulated date/time and save it, **Then** the selection is persisted and becomes the active business-logic reference time.
2. **Given** a simulated date/time is active, **When** the user navigates to the schedule page, **Then** event filtering and upcoming match selection use the simulated value.
3. **Given** a user clears simulation mode, **When** they save settings, **Then** the system returns to using current real-world time for logic.

---

### User Story 3 - View Unified Upcoming Schedule (Priority: P2)

As a drive team member, I can open a schedule page and see one interleaved list of upcoming matches for all subscribed teams, ordered by predicted match time.

**Why this priority**: A unified timeline helps prioritize match preparation and reduces manual cross-checking across teams.

**Independent Test**: Can be fully tested by loading subscribed teams with active events and verifying that the schedule view combines all relevant upcoming matches into a single time-ordered list.

**Acceptance Scenarios**:

1. **Given** subscribed teams have current active events at the selected business time, **When** the schedule page loads, **Then** the system retrieves each team’s current event and displays only upcoming matches from those events.
2. **Given** upcoming matches exist for multiple subscribed teams, **When** results are displayed, **Then** matches are interleaved into one list sorted by predicted match time ascending.
3. **Given** no subscribed teams have an active event at the selected business time, **When** the schedule page loads, **Then** the user sees an explicit empty-state message explaining that no current events were found.

### Edge Cases

- A subscribed team has no event active at the selected business time while others do; only teams with active events contribute matches.
- A team’s event data is temporarily unavailable; schedule still renders available teams and flags partial data.
- Two or more matches have the same predicted time; results are shown with deterministic secondary ordering.
- Predicted time is missing for a match; the match is still shown with a fallback ordering rule and a missing-time indicator.
- The subscribed team list is empty; schedule page shows setup guidance instead of a blank list.
- The simulated date/time is in the past or far future; logic remains valid and consistently uses that selected value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a configuration page where users can add and remove subscribed teams.
- **FR-002**: The system MUST validate team identifiers before accepting them and MUST prevent duplicate subscriptions.
- **FR-003**: The system MUST persist subscribed team selections so they remain available across sessions.
- **FR-004**: The system MUST provide a user-controlled date/time selector for business-logic simulation.
- **FR-005**: The system MUST allow users to enable simulation mode and clear it to return to real-time logic.
- **FR-006**: The system MUST persist the active simulation setting and selected simulated date/time across sessions.
- **FR-007**: The schedule page MUST display upcoming matches for subscribed teams using event and match data sourced from The Blue Alliance.
- **FR-008**: For each subscribed team, the system MUST identify the team’s currently active event at the effective business time before selecting upcoming matches.
- **FR-009**: The schedule page MUST include only matches that are upcoming relative to the effective business time.
- **FR-010**: The system MUST merge upcoming matches from all eligible subscribed teams into a single schedule ordered by predicted match time.
- **FR-011**: When no eligible upcoming matches exist, the schedule page MUST show a clear empty-state explanation.
- **FR-012**: When only partial external data is available, the schedule page MUST show available results and clearly indicate incomplete coverage.
- **FR-013**: Watch page behavior is out of scope for this feature and MUST remain unchanged.

### Key Entities *(include if feature involves data)*

- **Subscribed Team**: A team selected by the user for tracking; includes team identifier and active/inactive subscription status.
- **Simulation Clock Setting**: User-defined business-logic time mode; includes whether simulation is enabled and the selected date/time.
- **Team Event Snapshot**: The event context for a subscribed team at the effective business time; includes event identifier, active-state determination, and event time window.
- **Scheduled Match Entry**: A single upcoming match candidate; includes match identifier, associated team(s), predicted start time, and display status indicators.
- **Unified Schedule**: The ordered collection of scheduled match entries combined across all subscribed teams for presentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can configure subscribed teams and save changes in under 2 minutes during moderated usability testing.
- **SC-002**: 100% of schedule loads with valid upstream data produce a single, chronologically ordered list of upcoming matches without manual refresh.
- **SC-003**: In test scenarios with simulation enabled, business logic uses the selected simulated date/time correctly in at least 98% of validation cases.
- **SC-004**: When no current events are available for subscribed teams, users are shown an explicit empty-state message in 100% of occurrences.
- **SC-005**: At least 90% of pilot users report that the unified schedule reduces time spent manually cross-checking team matches.

## Assumptions

- Users of this feature are competition staff members who understand team identifiers and need rapid schedule visibility.
- The external data source provides event and predicted match-time information with occasional gaps or temporary outages.
- Subscription and simulation preferences are stored per user context in the existing app settings behavior.
- Schedule calculations use one effective business time value at a time: either simulated date/time or current real-world time.
- Authentication, authorization, and watch page enhancements are not part of this feature scope.
