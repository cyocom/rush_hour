# Implementation Plan: Shareable Configuration URL

**Branch**: `004-shareable-config-url` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-shareable-config-url/spec.md`

## Summary

Enable users to generate a `/#/share/<Base64>` URL that encodes their subscribed teams and optional TBA API key, copy it to the clipboard from the Config page, and allow recipients to open the URL and import the configuration via a confirmation dialog before any preferences are changed. Paired with a `createBrowserRouter` → `createHashRouter` migration required for correct GitHub Pages operation, and a `package.json` `homepage` entry for the canonical deployment URL.

## Technical Context

**Language/Version**: TypeScript ~6.0  
**Primary Dependencies**: React 19, React Router 7 (`createHashRouter`), Tailwind CSS, styled-components 6, date-fns 4, Vite 8  
**Storage**: `localStorage` via existing `writePersistentPreferences` service — no new storage keys  
**Testing**: Vitest (unit + integration), Playwright (e2e)  
**Target Platform**: Static web — GitHub Pages (`https://cyocom.github.io/rush_hour/`)  
**Project Type**: Web application (single-page, static-first)  
**Performance Goals**: Share URL generation < 100 ms; URL length < 2,000 chars for 100 teams  
**Constraints**: No server-side runtime; offline-capable; all routing must work via hash fragment  
**Scale/Scope**: Single-user client; share payload supports up to 100 teams comfortably within URL limits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality First | ✅ PASS | Pure encode/decode service; minimal new components; no unnecessary abstractions. `window.location.replace` is used intentionally to force reload — documented in research. |
| II. Responsive & Accessible | ✅ PASS | Share dialog and import confirmation page must be responsive and keyboard-accessible. Tailwind utilities used throughout. |
| III. Static-First Architecture | ✅ PASS | This feature directly enables correct static deployment. No new server requirements. |
| IV. Performance & Feedback | ✅ PASS | Clipboard success/failure feedback required (per contracts). URL generation is synchronous and near-instant. |

**Post-design re-check**: All gates continue to pass. No violations introduced in Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/004-shareable-config-url/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── ui-contract.md   # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── router.tsx                          # MODIFY: createHashRouter, add /share/:payload
├── components/
│   └── config/
│       └── ShareConfigDialog.tsx           # NEW: share URL generation dialog
├── domain/
│   └── services/
│       └── shareUrl.ts                     # NEW: buildShareUrl() + decodeSharePayload()
└── pages/
    ├── ConfigPage/
    │   └── ConfigPage.tsx                  # MODIFY: add share button + dialog
    └── SharePage/
        └── SharePage.tsx                   # NEW: /#/share/:payload import confirmation

tests/
├── e2e/
│   ├── smoke.spec.ts                       # MODIFY: hash paths (/#/watch, /#/config)
│   ├── config.spec.ts                      # MODIFY: hash paths
│   ├── watch.spec.ts                       # MODIFY: hash paths
│   └── responsive-theme.spec.ts            # MODIFY: hash paths
├── integration/
│   └── share-page.test.tsx                 # NEW: SharePage import confirmation tests
└── unit/
    └── shareUrl.test.ts                    # NEW: encode/decode unit tests

package.json                                # MODIFY: add "homepage" field
```

**Structure Decision**: Single-project web application layout (existing). New domain service in `src/domain/services/`, new page in `src/pages/SharePage/`, new component in `src/components/config/`. No structural changes beyond adding these files.

## Complexity Tracking

No constitution violations — no complexity justification required.
