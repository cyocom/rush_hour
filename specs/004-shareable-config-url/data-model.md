# Data Model: Shareable Configuration URL

**Feature**: 004-shareable-config-url  
**Date**: 2026-04-17

---

## Entities

### `SharePayload` (wire format — encoded in URL)

The JSON object that gets URL-safe Base64-encoded and embedded as the `/:payload` segment of the `/#/share/:payload` route.

```ts
interface SharePayload {
  v: 1                  // Schema version. Must equal 1 for this release.
  teams: string[]       // Ordered team IDs (e.g. ["frc254", "frc1678"]). Order = priority rank.
  key?: string          // TBA API key. Present only when user opts in to sharing it.
}
```

**Validation rules on decode:**
- `v` must be `1`; any other value → treat as unknown schema → silent redirect
- `teams` must be a non-empty `string[]`
- `key` if present must be a non-empty string (trim whitespace when reading)
- Any JSON parse error or Base64 decode error → silent redirect to `/#/watch`

**Size budget:** 100 teams × ~8 chars/ID + structural overhead ≈ ~950 Base64 chars total URL < 2,000 chars ✓

---

### `DecodedSharePayload` (in-memory, after validation)

The validated, typed result of successfully decoding and validating a `SharePayload`. Used by `SharePage` to drive UI.

```ts
interface DecodedSharePayload {
  teams: string[]       // Validated ordered team IDs
  apiKey: string | null // Validated API key, or null if not present in payload
}
```

---

### `ShareUrlOptions` (used by the URL generator)

Input to the share URL builder function.

```ts
interface ShareUrlOptions {
  teams: string[]       // Ordered team IDs to encode
  apiKey: string | null // API key to include, or null to omit
}
```

---

## State Transitions

### Share URL Generation (Config page)

```
User opens Config page
  └─ [has teams?]
       ├─ No  → "Share" button disabled / empty-state message
       └─ Yes → "Share" button enabled
                 └─ User clicks "Share"
                      └─ Share dialog opens
                           ├─ [has API key?]
                           │    ├─ Yes → "Include API key" checkbox shown (checked by default)
                           │    └─ No  → Notice: "No API key configured — teams only"
                           ├─ URL generated and displayed
                           └─ User copies URL → clipboard success feedback
```

### Import Flow (SharePage at `/#/share/:payload`)

```
User navigates to /#/share/<BASE64>
  └─ SharePage mounts
       └─ Decode payload
            ├─ INVALID → window.location.replace('/#/watch')  [silent, no UI change]
            └─ VALID   → Confirmation dialog shown
                          ├─ [User accepts]
                          │    ├─ Write teams to localStorage
                          │    ├─ Optionally write API key (user may have unchecked)
                          │    └─ window.location.replace('/#/watch')  [full reload]
                          └─ [User declines]
                               └─ window.location.replace('/#/watch')  [no changes]
```

---

## Service Interface

### `src/domain/services/shareUrl.ts`

```ts
/** Encodes a ShareUrlOptions into a full shareable URL string. */
function buildShareUrl(opts: ShareUrlOptions): string

/** Decodes a raw Base64 path segment. Returns null if invalid. */
function decodeSharePayload(encoded: string): DecodedSharePayload | null
```

---

## Storage

No new storage keys are introduced. The import writes to the existing `rushhour.appPreferences.v1` localStorage key via the existing `writePersistentPreferences` service.

---

## Affected Existing Models

| File | Change |
|------|--------|
| `src/domain/models/schedule.ts` | No changes — `AppPersistentPreferences` already contains `subscribedTeams` and `tbaApiKey` |
| `src/app/router.tsx` | Replace `createBrowserRouter` with `createHashRouter`; remove `basename`; add `/share/:payload` route |
| `package.json` | Add `"homepage"` field |
