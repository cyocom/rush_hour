# RUSHhour

Static React application for a FIRST Robotics watch experience with two flows:
- `/config` for managing tracked teams and priority order
- `/watch` for upcoming match alerts and overlap conflict warnings

## Local development

```bash
pnpm install
pnpm dev
```

## Test and quality commands

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Implementation notes

- Team preferences are session-scoped and persisted in `sessionStorage` under `rushhour.watchPreferences.v1`.
- Watch alerts and conflicts are derived from local mock match windows in `src/data/mock/matches.ts`.
- No third-party API requests are required for watch/config behavior.
- Stable `data-testid` hooks are provided for watch and config UI contract assertions.
