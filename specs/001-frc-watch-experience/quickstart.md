# Quickstart: FIRST Robotics Watch Experience

## Goal
Validate tracked-team configuration and watch-page alerts/conflicts using local mock data only.

## Prerequisites
- Node.js 20 LTS
- npm 10+

## Setup
1. Install dependencies.
2. Start the app in development mode.
3. Open the app in a browser and confirm routes `/watch` and `/config` are reachable.

## Manual Validation Flow
1. Navigate to `/config`.
2. Add three valid teams (example: `frc254`, `frc1678`, `frc1114`).
3. Reorder teams so priority visibly changes.
4. Remove one team and verify contiguous priority order remains.
5. Navigate to `/watch`.
6. Confirm mock stream panel is visible.
7. Confirm upcoming alerts appear for tracked teams.
8. Confirm at least one overlap in mock data produces a conflict notification.
9. Clear teams (or use empty session) and verify empty guidance states.

## Automated Test Targets
- Unit/component:
  - Team input validation
  - Rank normalization after reorder/remove
  - Alert deduplication
  - Conflict overlap detection
- Smoke e2e:
  - `/config` add/reorder/remove happy path
  - `/watch` alert and conflict rendering path

## Out of Scope Verification
- Confirm no third-party API requests are required for watch/config behavior.
# Quickstart: FIRST Robotics Watch Experience

## Goal
Validate the planned behavior for tracked-team configuration and watch-page alerts/conflicts using local mock data only.

## Prerequisites
- Node.js 20 LTS
- npm 10+

## Setup
1. Install dependencies.
2. Start the app in development mode.
3. Open the app in a browser and confirm routes `/watch` and `/config` are reachable.

## Manual Validation Flow
1. Navigate to `/config`.
2. Add three valid teams (example: `frc254`, `frc1678`, `frc1114`).
3. Reorder teams so priority visibly changes.
4. Remove one team and verify contiguous priority order remains.
5. Navigate to `/watch`.
6. Confirm mock stream panel is visible.
7. Confirm upcoming alerts appear for tracked teams.
8. Confirm at least one overlap in mock data produces a conflict notification.
9. Clear teams (or use empty session) and verify empty guidance states:
   - no teams configured
   - no upcoming tracked matches

## Automated Test Targets
- Unit/component:
  - Team input validation (empty/duplicate rejection)
  - Rank normalization after reorder/remove
  - Alert deduplication when multiple tracked teams share one match
  - Conflict overlap detection
- Smoke e2e:
  - `/config` add/reorder/remove happy path
  - `/watch` alert and conflict rendering path

## Performance Checks
- Initial render target: <2s on standard broadband.
- Alert/conflict recalculation target: <100ms for dataset <=50 upcoming matches.

## Out of Scope Verification
- Confirm no third-party API requests are required for watch/config behavior.
