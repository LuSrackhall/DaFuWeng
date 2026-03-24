## Why

The reconnect success strip is now easier to notice, but once it disappears the user loses the most recent recovery context.

Spectator reconnect coverage also still misses three high-pressure phases: live auction, trade response, and jail decision.

## What Changes

- Preserve a lightweight recent recovery recap after the reconnect success strip disappears.
- Add spectator reconnect regressions for auction, trade response, and jail decision pressure phases.
- Extend reconnect recap validation to cover post-dismissal recall.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: reconnect feedback now remains lightly reviewable after dismissal, and spectator reconnect coverage includes more pressure phases.

## Impact

- Affected code: room overview recap UI, reconnect presentation state in GamePage, Playwright reconnect regressions.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.