# Feature Specification: Hide Offline YouTube Streams

**Feature Branch**: `005-new-specification`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "lets add functionality (specifically for youtube streams) to hide streams that are currently offline"

## Clarifications

### Session 2026-04-17

- Q: How should stream selection behave when no streams are currently online? → A: Show all streams and flag them as offline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Focus On Live Streams (Priority: P1)

As a viewer on the watch experience, I want offline YouTube stream options hidden so I can choose from streams that are currently watchable without trial-and-error.

**Why this priority**: This directly improves the core watch workflow by reducing dead-end clicks and confusion during match viewing.

**Independent Test**: Can be fully tested by opening a match with a mix of live and offline YouTube stream options and verifying only live options are shown by default.

**Acceptance Scenarios**:

1. **Given** a match has at least one live YouTube stream and at least one offline YouTube stream, **When** the viewer opens stream selection, **Then** only live YouTube streams are displayed.
2. **Given** a match has only offline YouTube streams, **When** the viewer opens stream selection, **Then** all available streams are displayed with an offline flag and the viewer sees clear messaging that no streams are currently online.

---

### User Story 2 - Preserve Access To Other Stream Types (Priority: P2)

As a viewer, I want non-YouTube stream options to remain available regardless of YouTube stream status so that YouTube filtering does not remove unrelated viewing options.

**Why this priority**: Prevents regressions by ensuring the new behavior is limited to the requested YouTube-specific scope.

**Independent Test**: Can be fully tested by opening a match with offline YouTube options plus non-YouTube options and confirming non-YouTube options remain visible.

**Acceptance Scenarios**:

1. **Given** a match includes offline YouTube streams and at least one non-YouTube stream, **When** stream selection is displayed, **Then** offline YouTube streams are hidden and non-YouTube streams remain visible.
2. **Given** no streams are currently online, **When** stream selection is displayed, **Then** all streams remain visible and each is flagged offline.

---

### User Story 3 - Keep Selection Stable During Status Changes (Priority: P3)

As a viewer actively watching a stream, I want the current selection to remain predictable if stream availability changes so I understand what happened and can quickly recover.

**Why this priority**: Improves trust and usability when stream status changes near real time.

**Independent Test**: Can be fully tested by selecting a YouTube stream and simulating a transition from live to offline, then verifying the system handles the change with clear user feedback and a recoverable state.

**Acceptance Scenarios**:

1. **Given** a viewer has selected a YouTube stream that later becomes offline, **When** stream availability is refreshed, **Then** the stream is removed from selectable live YouTube options and the viewer is informed that the selected stream is no longer live.

### Edge Cases

- A YouTube stream has unknown availability status at load time; it is treated as unavailable until confirmed live.
- A stream changes from offline to live while the viewer remains on the page; it becomes available on the next availability refresh.
- A match has no streams of any type; the viewer sees a neutral empty state with no selectable options.
- Availability checks fail temporarily; the viewer sees current known live options and a non-blocking warning that status may be stale.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST evaluate availability for YouTube stream options before presenting them as selectable.
- **FR-002**: The system MUST hide YouTube stream options that are currently offline from the primary selectable stream list when at least one stream is currently online.
- **FR-003**: The system MUST show only currently online streams as primary selectable options when one or more streams are online.
- **FR-004**: The system MUST retain visibility of non-YouTube stream options regardless of YouTube stream status.
- **FR-005**: The system MUST provide clear user messaging when no streams are currently online for a match.
- **FR-006**: The system MUST update presented YouTube stream availability when new status information is received during the viewing session.
- **FR-007**: The system MUST handle unknown or failed YouTube availability checks by flagging affected streams as offline or unknown and informing the viewer that status may be outdated.
- **FR-008**: The system MUST remove a previously selected YouTube stream from selectable options if it becomes offline and notify the viewer of the change.
- **FR-009**: The system MUST display all streams with an offline flag when no streams are currently online, rather than presenting an empty stream list.

### Key Entities *(include if feature involves data)*

- **Stream Option**: A watchable source associated with a match, including provider type and display metadata.
- **YouTube Availability Status**: Current live/offline/unknown state for a YouTube stream option at a specific point in time.
- **Viewer Stream Selection State**: The currently selected stream and its validity based on latest known availability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation scenarios where at least one stream is online, 100% of offline YouTube streams are excluded from primary selectable options.
- **SC-002**: At least 95% of viewers can select a watchable stream on their first attempt in usability checks involving mixed live/offline YouTube options.
- **SC-003**: When no streams are online, 100% of users are shown all available streams with offline flags and a clear, actionable status message within 2 seconds of opening stream selection.
- **SC-004**: In monitored sessions where a selected YouTube stream goes offline, 100% of affected users receive clear status-change feedback and can recover to another available stream option without reloading the page.

## Assumptions

- The feature applies only to YouTube stream options; behavior for other providers remains unchanged unless explicitly specified in a future feature.
- Stream availability data can be refreshed during an active watch session often enough to reflect meaningful status changes.
- Existing watch experience patterns for status messaging and empty states are reused for consistency.
- Historical or upcoming (not yet live) YouTube streams are treated as unavailable for immediate viewing.
- If no streams are online, showing offline streams is preferred over showing no streams.
