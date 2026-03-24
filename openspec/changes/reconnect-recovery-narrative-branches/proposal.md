## Why

The reconnect success strip now confirms recovery and shows basic context, but it still stops short of a complete recovery narrative.

Automated coverage also still misses three valuable branches: fallback recovery with no latest event summary, mobile player reconnect during property decision, and mobile player reconnect during deficit recovery.

## What Changes

- Upgrade reconnect success context into a single-sentence recovery narrative.
- Add an automated fallback reconnect regression when no latest event summary exists.
- Add mobile player reconnect regressions for property decision and deficit recovery.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: reconnect success feedback now explains ordinary turn recovery, property decision recovery, and deficit recovery more clearly.

## Impact

- Affected code: reconnect success strip narrative, Playwright reconnect regressions, OpenSpec artifacts.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.