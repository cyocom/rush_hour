# UI Contract: Config Page and Schedule View

> Extends the contract from feature 001. All existing routes, theme values, session keys, and testability hooks from feature 001 remain in force.

---

## Routes

| Route | Page | Status |
|-------|------|--------|
| `/watch` | WatchPage | Existing (unchanged) |
| `/config` | ConfigPage | Existing (augmented) |
| `/schedule` | SchedulePage | **New** |

---

## Global Contract

- Theme colors `rgb(150, 29, 55)` and `#0a0a0a` apply on all routes including `/schedule`.
- All pages responsive from 320px width upward.
- Navigation must include a link to `/schedule` in addition to existing links.

---

## Storage Keys

| Key | Storage | Owner | Notes |
|-----|---------|-------|-------|
| `rushhour.watchPreferences.v1` | `sessionStorage` | Feature 001 | In-session watch preferences |
| `rushhour.appPreferences.v1` | `localStorage` | Feature 002 | Cross-session: subscribed teams, sim clock, TBA key |

---

## Config Page Additions (`/config`)

The following sections are added to the existing Config page:

### Subscribed Teams Section

Manages the persistent list of subscribed teams (distinct from the in-session tracked teams used by the watch page).

| Hook | Element | Purpose |
|------|---------|---------|
| `config-subscribed-team-input` | Text input | Enter a team number to subscribe |
| `config-subscribed-team-add-btn` | Button | Submit subscription |
| `config-subscribed-team-list` | List container | Displays all subscribed teams |
| `config-subscribed-team-item` | List item | Individual subscribed team row |
| `config-subscribed-team-remove-btn` | Button per item | Remove a subscribed team |
| `config-subscribed-team-validation-error` | Error element | Validation message for invalid/duplicate entry |

### Simulation Clock Section

| Hook | Element | Purpose |
|------|---------|---------|
| `config-sim-clock-toggle` | Checkbox/toggle | Enable/disable simulation mode |
| `config-sim-clock-datetime-input` | DateTime input | Set simulated date and time |
| `config-sim-clock-save-btn` | Button | Persist simulation clock setting |
| `config-sim-clock-active-indicator` | Status indicator | Shows currently active simulated time |

### TBA API Key Section

| Hook | Element | Purpose |
|------|---------|---------|
| `config-tba-api-key-input` | Text input (password type) | Enter TBA read API key |
| `config-tba-api-key-save-btn` | Button | Persist API key to localStorage |
| `config-tba-api-key-status` | Status element | Shows whether key is configured |

---

## Schedule Page (`/schedule`)

| Hook | Element | Purpose |
|------|---------|---------|
| `schedule-page-root` | Page root container | Top-level testability anchor |
| `schedule-effective-time-display` | Indicator | Shows effective business time (real or simulated) |
| `schedule-load-status` | Loading indicator | Shown during TBA API fetch |
| `schedule-match-list` | List container | The unified sorted match list |
| `schedule-match-entry` | List item | Individual match row |
| `schedule-match-entry-time` | Time cell | Predicted time display or fallback |
| `schedule-match-entry-teams` | Teams cell | Highlights subscribed teams |
| `schedule-empty-state` | Empty state container | Shown when no upcoming matches |
| `schedule-partial-data-banner` | Warning banner | Shown when one or more teams have fetch errors |
| `schedule-team-status-list` | List container | Per-team event/error status breakdown |
| `schedule-no-api-key-prompt` | Prompt container | Shown when TBA API key is not configured |

---

## Behavior Contracts

### Config Page – Subscribed Teams
- Adding a team: `config-subscribed-team-input` accepts input → `config-subscribed-team-add-btn` click → if valid and not duplicate, entry appended to `config-subscribed-team-list` and persisted → on error, `config-subscribed-team-validation-error` becomes visible.
- Removing a team: `config-subscribed-team-remove-btn` removes the team row and persists the updated list.

### Config Page – Simulation Clock
- `config-sim-clock-toggle` controls visibility/enabled state of `config-sim-clock-datetime-input` and `config-sim-clock-save-btn`.
- When simulation is enabled and saved, `config-sim-clock-active-indicator` displays the active simulated datetime.
- When simulation is disabled and saved, `config-sim-clock-active-indicator` shows "Using real time".

### Schedule Page
- On mount, fetch team events and matches from TBA using the stored API key.
- While fetching, `schedule-load-status` is visible.
- If `rushhour.appPreferences.v1.tbaApiKey` is empty, show `schedule-no-api-key-prompt` and skip fetch.
- When `entries.length === 0` and all fetches settled without error, show `schedule-empty-state`.
- When any `TeamScheduleStatus.status === 'error'`, show `schedule-partial-data-banner`.

---

## Inherited Testability Hooks (Feature 001)

| Hook | Notes |
|------|-------|
| `watch-stream-panel` | Unchanged |
| `watch-alert-list` | Unchanged |
| `watch-conflict-list` | Unchanged |
| `config-team-input` | Existing in-session team input; unchanged |
| `config-team-list` | Existing in-session team list; unchanged |
