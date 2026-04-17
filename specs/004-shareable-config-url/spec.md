# Feature Specification: Shareable Configuration URL

**Feature Branch**: `004-shareable-config-url`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "I'd like to add a feature where a user can generate a sharable url to share their configured teams and tba api key with others."

## Clarifications

### Session 2026-04-17

- Q: How should the share payload be embedded in the URL given the app uses HashRouter? → A: Base64 path segment — `/#/share/BASE64_PAYLOAD` — with custom parsing on the dedicated share route.
- Q: After the import confirmation is accepted or declined on `/#/share/…`, where should the app navigate? → A: Redirect to `/#/watch` after both accept and decline.
- Q: How should the GitHub Pages base path (`/rush_hour/`) be configured for production builds? → A: Add `homepage` field to `package.json` and pass `VITE_BASE_PATH=/rush_hour/` as an env var in CI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate and Copy a Shareable Configuration Link (Priority: P1)

As an FRC scout or mentor, I want to generate a shareable URL that encodes my subscribed teams and TBA API key so I can quickly onboard teammates or collaborators without them having to manually re-enter everything.

**Why this priority**: This is the core value proposition of the feature — producing the URL. Nothing else works without it.

**Independent Test**: Can be fully tested by having at least one subscribed team and a TBA API key configured, triggering the "Share" action, and verifying that a URL is generated and copied to the clipboard (or displayed for copying).

**Acceptance Scenarios**:

1. **Given** a user has one or more subscribed teams and a TBA API key saved, **When** they activate the share action, **Then** a URL is generated that encodes all subscribed teams and the TBA API key.
2. **Given** a user has subscribed teams but no TBA API key, **When** they activate the share action, **Then** a URL is generated that encodes the subscribed teams only, and a notice is shown that the API key was omitted.
3. **Given** a user has no subscribed teams, **When** they activate the share action, **Then** the share action is disabled or a message explains there is nothing to share yet.
4. **Given** a URL has been generated, **When** the user activates the copy action, **Then** the full URL is copied to the clipboard and a success confirmation is shown.

---

### User Story 2 - Import Configuration from a Shared URL (Priority: P1)

As an FRC drive team member or scout who received a shared link, I want opening that link to let me import the sender's teams and API key so I can start watching immediately without manual setup.

**Why this priority**: The share URL has no value without an import flow on the receiving end. Together with Story 1 these two stories form a complete MVP.

**Independent Test**: Can be fully tested by constructing a valid share URL and navigating to it, then verifying that an import prompt appears and, upon confirmation, the teams and API key are written to the recipient's local preferences.

**Acceptance Scenarios**:

1. **Given** a user opens a valid share URL, **When** the page loads, **Then** the app detects the import payload and presents a confirmation dialog showing the teams and whether an API key is included, before making any changes.
2. **Given** the user confirms the import, **When** the confirmation is accepted, **Then** the subscribed teams and TBA API key from the URL are written to local preferences and the app navigates to `/#/watch` reflecting the imported configuration.
3. **Given** the user declines the import, **When** the confirmation is dismissed, **Then** no preferences are changed and the app navigates to `/#/watch`.
4. **Given** a share URL contains an API key, **When** the import confirmation is displayed, **Then** the dialog notes that the API key was shared and gives the user an option to skip importing the API key while still importing the teams.
5. **Given** a share URL is malformed or contains unrecognizable data, **When** the page loads, **Then** the import prompt is not shown and the app loads normally with no changes.

---

### User Story 3 - Opt Out of Sharing the API Key (Priority: P2)

As a user who wants to share my team list with others but keep my personal TBA API key private, I want a toggle that lets me exclude the API key from the generated URL.

**Why this priority**: API keys are credentials and users may not want to share them even if sharing team lists is convenient. This gives users control over what they share.

**Independent Test**: Can be fully tested independently by generating a share URL with the API key opt-out enabled and verifying the resulting URL does not encode any API key data.

**Acceptance Scenarios**:

1. **Given** a user is generating a share URL, **When** the share UI is shown, **Then** a clearly labeled option allows them to exclude the TBA API key from the URL (defaulting to included if a key is present).
2. **Given** the user opts out of including the API key, **When** the URL is generated, **Then** the URL encodes only the subscribed teams.
3. **Given** a recipient imports a URL without an API key, **When** the import confirmation is shown, **Then** the dialog indicates no API key was included in the share.

---

### Edge Cases

- What happens when the Base64 payload is so long it exceeds browser URL length limits (e.g., very large team lists)?
- How does the app behave if the user's clipboard access is denied by the browser?
- What if a share URL contains team IDs that are structurally valid but unknown to TBA?
- What happens if a recipient already has configured teams — they are replaced (not merged) upon confirmed import.
- What happens if the Base64 string in the path segment is valid Base64 but decodes to an unrecognized JSON structure?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a "Share" action accessible from the configuration/settings area that generates a shareable URL encoding the current subscribed teams.
- **FR-002**: The generated URL MUST encode the subscribed teams in priority order (the order they are stored in preferences).
- **FR-003**: By default, the generated URL MUST include the TBA API key if one is configured; users MUST be able to opt out of including it.
- **FR-004**: The share UI MUST display the generated URL and provide a one-click copy-to-clipboard action.
- **FR-005**: The share action MUST be disabled (or show an empty-state message) when no teams are subscribed.
- **FR-006**: The share URL format MUST be `<origin>/#/share/<BASE64_PAYLOAD>` where `BASE64_PAYLOAD` is a URL-safe Base64-encoded JSON object containing team IDs and an optional API key.
- **FR-007**: The app MUST register a `/#/share/:payload` route; when this route loads it MUST decode the payload and present an import confirmation before altering any preferences.
- **FR-008**: The import confirmation MUST display the list of teams to be imported and indicate whether an API key is included.
- **FR-009**: When an API key is present in the import payload, the confirmation MUST offer an option to skip importing the API key while still importing the teams.
- **FR-010**: Upon confirmed import, the app MUST write the teams and (optionally) the API key to local preferences and navigate to `/#/watch`.
- **FR-011**: Upon declined import, the app MUST navigate to `/#/watch` without modifying any preferences.
- **FR-012**: If the share URL payload is malformed or unrecognizable (invalid Base64 or unrecognized schema), the app MUST silently redirect to `/#/watch` and load normally.
- **FR-013**: The Base64 encoding scheme MUST be compact enough to remain within typical browser URL length limits for reasonable team list sizes (up to 100 teams).
- **FR-014**: The app router MUST be migrated from `createBrowserRouter` to `createHashRouter` to ensure all routes function correctly when hosted on GitHub Pages without server-side rewrite support.
- **FR-015**: The `package.json` MUST include a `homepage` field set to `https://cyocom.github.io/rush_hour/`; the production build MUST receive `VITE_BASE_PATH=/rush_hour/` via CI environment variable to align asset paths.

### Key Entities

- **Share Payload**: A URL-safe Base64-encoded JSON object containing a list of team IDs (ordered by priority) and an optional TBA API key, embedded as the path parameter of the `/#/share/:payload` route.
- **Import Confirmation**: The UI dialog rendered by the `/#/share/:payload` route that presents the decoded payload to the recipient for review and acceptance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with configured teams can generate and copy a shareable URL in under 10 seconds.
- **SC-002**: A recipient who opens a valid share URL can import the full configuration in under 3 clicks/taps.
- **SC-003**: Share URLs for up to 100 subscribed teams remain under 2,000 characters (fitting within common URL length constraints).
- **SC-004**: 100% of malformed share URLs are silently ignored — the app never enters an error state due to a bad share URL.
- **SC-005**: No preferences are modified without explicit user confirmation when importing from a shared URL.

## Assumptions

- The sharing mechanism is URL-based only (no QR code, no server-side storage, no link-shortening service).
- The app runs in a standard web browser that supports the Clipboard API; a graceful fallback (selecting text for manual copy) is acceptable when clipboard access is denied.
- Recipient confirmation before import is required (no silent auto-apply of shared configs).
- When a recipient confirms an import that includes teams, the existing subscribed teams are **replaced** (not merged) by the imported list; this avoids ambiguous merge-conflict UX for v1.
- Team IDs from the shared URL are accepted as-is; live TBA validation of team existence is out of scope for the import flow.
- The simulation clock state is excluded from the share payload as it is time-sensitive and personal.
- Share URL generation is surfaced in the Config/Settings page, not the Watch page.
- The app is deployed to GitHub Pages at `https://cyocom.github.io/rush_hour/`; because GitHub Pages does not support server-side URL rewrites, the router MUST use hash-based routing (`HashRouter` / `createHashRouter`) so that direct URL access and page refreshes function correctly.
- `VITE_BASE_PATH` is set to `/rush_hour/` in the CI/CD build environment; the `package.json` `homepage` field documents the canonical deployment URL for tooling that reads it.
