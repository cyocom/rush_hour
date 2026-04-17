# Quickstart: Shareable Configuration URL

**Feature**: 004-shareable-config-url  
**Date**: 2026-04-17

---

## What's Being Built

Three coordinated changes:

1. **HashRouter migration** — switch from `createBrowserRouter` to `createHashRouter` so the app works correctly on GitHub Pages without server-side URL rewrites.
2. **Share URL generation** — a "Share Configuration" button on the Config page that builds and copies a `/#/share/<Base64>` URL encoding the user's teams and optionally their TBA API key.
3. **Import flow** — a dedicated `/#/share/:payload` route that decodes the payload and presents a confirmation dialog before writing to localStorage.

---

## New Files

| File | Purpose |
|------|---------|
| `src/domain/services/shareUrl.ts` | `buildShareUrl()` and `decodeSharePayload()` — pure encode/decode logic |
| `src/pages/SharePage/SharePage.tsx` | The `/#/share/:payload` route — import confirmation UI |
| `src/components/config/ShareConfigDialog.tsx` | Modal dialog: displays generated URL and copy button |
| `tests/unit/shareUrl.test.ts` | Unit tests for encode/decode, size, error cases |
| `tests/integration/share-page.test.tsx` | Integration tests for SharePage confirmation flow |

---

## Modified Files

| File | Change |
|------|--------|
| `src/app/router.tsx` | `createBrowserRouter` → `createHashRouter`, remove `basename`, add `/share/:payload` route |
| `src/pages/ConfigPage/ConfigPage.tsx` | Add "Share Configuration" button that opens `ShareConfigDialog` |
| `package.json` | Add `"homepage": "https://cyocom.github.io/rush_hour/"` |
| `tests/e2e/smoke.spec.ts` | Update `page.goto('/watch')` → `page.goto('/#/watch')` etc. |
| `tests/e2e/config.spec.ts` | Update route paths for hash router |
| `tests/e2e/watch.spec.ts` | Update route paths for hash router |
| `tests/e2e/responsive-theme.spec.ts` | Update route paths for hash router |

---

## Implementation Order

1. **`src/domain/services/shareUrl.ts`** — no dependencies; implement and unit-test first
2. **`src/app/router.tsx`** — migrate to `createHashRouter`, add `/share/:payload` route stub
3. **`src/pages/SharePage/SharePage.tsx`** — import confirmation page
4. **`src/components/config/ShareConfigDialog.tsx`** — share dialog (depends on `shareUrl.ts`)
5. **`src/pages/ConfigPage/ConfigPage.tsx`** — wire in the share button + dialog
6. **`package.json`** — add `homepage` field
7. **E2E test updates** — update all direct route navigations to hash paths

---

## Key Technical Decisions (see research.md for full rationale)

- **URL-safe Base64** via native `btoa`/`atob` — no library needed
- **`window.location.replace('/#/watch')`** after import (not `navigate()`) — forces full reload so `App`'s `useState` re-seeds from updated localStorage
- **`createHashRouter` drops `basename`** — Vite's `base` option (via `VITE_BASE_PATH`) handles asset paths independently
- **`"Skip API key"` checkbox is unchecked by default** — users must opt in to importing a credential

---

## Verification Checklist

- [ ] `pnpm test` — all unit + integration tests pass
- [ ] `pnpm test:e2e` — all Playwright tests pass with updated hash paths
- [ ] Generate a share URL → copy to clipboard succeeds
- [ ] Open share URL in new tab → confirmation dialog appears
- [ ] Accept import → preferences updated, redirects to `/#/watch`, teams visible
- [ ] Decline import → no preferences changed, redirects to `/#/watch`
- [ ] Malformed URL (e.g., `/#/share/!!!`) → silently redirects to `/#/watch`
- [ ] Navigate to `/#/watch` directly in a browser → no 404 (hash routing works)
- [ ] API key opt-out → generated URL does not contain key
- [ ] Share URL with 100 teams → URL length < 2,000 chars
