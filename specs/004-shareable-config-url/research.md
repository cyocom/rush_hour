# Research: Shareable Configuration URL

**Feature**: 004-shareable-config-url  
**Date**: 2026-04-17  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## 1. React Router 7 — `createHashRouter` Migration

### Decision
Replace `createBrowserRouter` with `createHashRouter` in `src/app/router.tsx`.

### Rationale
GitHub Pages serves only static files. Any direct navigation to a path like `/watch` or `/share/…` returns a 404 because no matching file exists. Hash routing (`/#/watch`, `/#/share/…`) works because the browser sends only the origin + path prefix to the server — the fragment (`#…`) never reaches GitHub Pages — and React Router handles routing entirely on the client.

### Key API difference
`createHashRouter` is a drop-in replacement for `createBrowserRouter` with one important difference: **the `basename` option is not supported and must be removed**. Vite's `base` config option (set via `VITE_BASE_PATH`) handles asset path prefixing independently of router logic.

```ts
// Before
return createBrowserRouter([...], { basename: baseName })

// After
return createHashRouter([...])  // no basename; Vite base handles asset paths
```

### Alternatives considered
- **404.html redirect trick**: Encode the path in the query string and redirect to `index.html`. More brittle, complicates CI, and confuses analytics. Rejected.
- **Static-site adapter (e.g., Cloudflare Pages)**: Requires migrating hosting. Out of scope.

---

## 2. URL-safe Base64 Encoding of the Share Payload

### Decision
Encode the JSON payload using **URL-safe Base64** (no padding): replace `+` with `-` and `/` with `_`, strip trailing `=`. Decode by reversing those substitutions. Use `btoa`/`atob` (available in all modern browsers and Node 16+) — no third-party library needed.

```ts
function encodePayload(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodePayload(encoded: string): unknown {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((encoded.length * 3) % 4 ? 0 : 2)
  return JSON.parse(atob(padded))
}
```

### Size estimate
A team ID like `"frc254"` is 6 bytes. 100 teams = ~700 bytes of JSON (with array delimiters + field names). Base64 overhead ≈ 33% → ~930 chars. Plus the `/#/share/` prefix (~10 chars) and origin (e.g., 45 chars). Total: **< 1000 chars for 100 teams**, well within the 2,000 char FR-013 requirement.

### Alternatives considered
- **URL query parameters** (`?teams=frc254,…`): Human-readable but teams list + API key becomes very long. Also, with HashRouter the canonical position for parameters is _inside_ the hash, not before it — a Base64 path segment is cleaner.
- **`encodeURIComponent` on raw JSON**: Produces very long percent-encoded strings (3× expansion for non-ASCII). Rejected for size.
- **MessagePack / binary**: Significantly more compact but requires a runtime dependency and produces non-ASCII bytes requiring percent-encoding anyway. Not worth the complexity.

---

## 3. Share Payload Schema

### Decision
```json
{ "v": 1, "teams": ["frc254", "frc1678"], "key": "abc123" }
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `v` | `number` | Yes | Schema version (`1` for v1). Allows future evolution. |
| `teams` | `string[]` | Yes | Ordered list of team IDs (e.g., `"frc254"`). Order = priority. |
| `key` | `string` | No | TBA API key. Omitted when user opts out of sharing. |

Validation rules on decode:
- `v` must equal `1` (future versions → silently ignore / redirect to watch)
- `teams` must be a non-empty array of strings
- `key` if present must be a non-empty string
- Any decode failure (bad Base64, invalid JSON, schema mismatch) → silent redirect to `/#/watch`

---

## 4. `/#/share/:payload` Route — Integration with React Router 7

### Decision
Add a `/share/:payload` route to the hash router. The `SharePage` component reads `useParams().payload`, decodes it, and handles the confirmation UI. After accept or decline, `useNavigate()` pushes to `/watch`.

```ts
{ path: '/share/:payload', element: <SharePage /> }
```

Because URL-safe Base64 uses only `[A-Za-z0-9\-_]` characters (no `/`), the payload is safe as a single path segment with no ambiguity.

---

## 5. `package.json` `homepage` Field

### Decision
Add `"homepage": "https://cyocom.github.io/rush_hour/"` to `package.json`.

This field is read by some tooling (e.g., `gh-pages` deploy scripts, certain bundlers) to determine the canonical base URL. It does not affect Vite's build directly. Vite reads `VITE_BASE_PATH` from the environment (already wired in `vite.config.ts`).

### CI / Build guidance
The existing `vite.config.ts` already reads `process.env.VITE_BASE_PATH ?? '/'`. For GitHub Pages CI, the build step must set:
```
VITE_BASE_PATH=/rush_hour/
```
This ensures all asset references (`<script src="/rush_hour/assets/…">`) resolve correctly under the `/rush_hour/` sub-path.

---

## 6. Playwright E2E Test Impact

### Decision
With HashRouter, direct page navigations must use hash paths. Update all `page.goto('/watch')` and `page.goto('/config')` calls to `page.goto('/#/watch')` etc. The `baseURL` in `playwright.config.ts` (`http://127.0.0.1:4173`) remains unchanged — only the path argument changes.

The `vite preview` server (used by Playwright) serves `index.html` for any unmatched path, so navigation to `http://127.0.0.1:4173/#/watch` works correctly during testing.

---

## 7. `WatchPreferencesContext` — Import Side-Effect

### Decision
After a confirmed import, the `SharePage` component must:
1. Call `writePersistentPreferences` directly to persist teams + optional key to `localStorage`.
2. Force a full page reload (or navigate to `/#/watch` with a state flag) so the `App` component re-initializes `trackedTeams` state from the freshly written `localStorage`.

**Simplest approach**: `window.location.replace('/#/watch')` after writing preferences. This causes a full page reload from the hash, causing `App`'s `useState` initializer to re-read `localStorage` — no context mutations needed.

### Alternatives considered
- Calling context methods (`addTeam`/`removeTeam`): The context is defined in `App.tsx`, not accessible from a route that lives outside it. Would require lifting state further or using a global store. Overkill for this feature.
- `navigate('/watch')` with state: SPA navigation would not reinitialize the `useState` hook — the import would not reflect without extra context wiring.
