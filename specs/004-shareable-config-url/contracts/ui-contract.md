# UI Contract: Shareable Configuration URL

**Feature**: 004-shareable-config-url  
**Date**: 2026-04-17

---

## Overview

This contract defines the component API boundaries and interaction model for the two new UI surfaces introduced by this feature:

1. **Share Config Dialog** — triggered from the Config page; generates and copies the share URL
2. **Share Import Page** — the `/#/share/:payload` route; decodes the URL and prompts the user to import

---

## 1. Share Config Dialog

### Entry Point

A **"Share Configuration"** button added to the Config page. The button is:
- **Disabled** when `trackedTeams.length === 0`
- **Enabled** when at least one team is tracked

### Dialog Contents

| Element | Behavior |
|---------|----------|
| Title | "Share your configuration" |
| Team list | Read-only list of team IDs to be shared (in priority order) |
| "Include API key" checkbox | Shown only when a TBA API key is configured. Checked by default. Unchecking omits the key from the URL. |
| "No API key" notice | Shown when no API key is configured; informs user that only teams will be shared |
| Generated URL field | Read-only text input displaying the full share URL; updates live when the checkbox toggles |
| "Copy" button | Copies the URL to clipboard via `navigator.clipboard.writeText`. On success: shows "Copied!" feedback for ~2 seconds. On failure (clipboard denied): selects the text in the input field so the user can copy manually. |
| Close / Cancel button | Closes the dialog; no side effects |

### Props Contract (`ShareConfigDialog`)

```ts
interface ShareConfigDialogProps {
  open: boolean
  onClose: () => void
  teams: string[]           // ordered team IDs
  apiKey: string | null     // null = no key configured
}
```

---

## 2. Share Import Page (`/#/share/:payload`)

### Route

```
/#/share/:payload
```

Where `:payload` is a URL-safe Base64 string. The page is a full-screen route rendered by the router — not a modal overlaid on another page.

### Decode outcomes

| Condition | Behavior |
|-----------|----------|
| Valid payload | Render confirmation UI (described below) |
| Invalid payload (bad Base64 / bad JSON / wrong schema version) | Call `window.location.replace('/#/watch')` immediately — no flash of content |

### Confirmation UI Contents

| Element | Behavior |
|---------|----------|
| Title | "Import shared configuration?" |
| Teams section | Lists all teams from the payload in priority order |
| API key section | "API key included" badge when a key is present; "No API key included" note when absent |
| "Skip API key" checkbox | Shown only when payload contains a key. Unchecked by default intentionally — users must opt in to accepting the API key. |
| "Import" button (primary) | Writes teams to `localStorage` via `writePersistentPreferences`; conditionally writes API key; then calls `window.location.replace('/#/watch')` |
| "Cancel" button (secondary) | Calls `window.location.replace('/#/watch')` without modifying preferences |

### Page Component Props

The `SharePage` component takes no external props — it reads `:payload` from `useParams()` and reads/writes preferences directly.

---

## 3. Router Contract

### Updated route table

| Hash Path | Component | Notes |
|-----------|-----------|-------|
| `/#/` | — | Redirects to `/#/watch` |
| `/#/watch` | `WatchPage` | Unchanged |
| `/#/config` | `ConfigPage` | Unchanged |
| `/#/schedule` | `SchedulePage` | Unchanged |
| `/#/share/:payload` | `SharePage` | New |

### Router type change

`createBrowserRouter` → `createHashRouter`. The `basename` option is removed. `createHashRouter` does not accept `basename`.

---

## 4. Interaction Constraints

- The import flow **must not** call context methods from `WatchPreferencesContext`. It writes directly to localStorage and triggers a full page reload to let `App`'s `useState` initializer re-hydrate from the updated storage.
- The share dialog **must not** modify any application state. It is purely a read + clipboard utility.
- All navigation after import/decline uses `window.location.replace` (not React Router's `navigate`) to guarantee a clean state reload.
