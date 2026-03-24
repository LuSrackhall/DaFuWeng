## Why

The recent recovery recap is now trustworthy, but its anchor wording still reads like internal system state instead of player-facing game language.

Its expiry is also visually abrupt, and mobile player reconnect coverage still misses the same pressure phases already covered for spectators: auction, trade response, and jail decision.

## What Changes

- Rewrite recovery anchor wording into more player-facing game language.
- Add a soft dismissal transition before stale recovery recaps fully disappear.
- Add mobile player reconnect regressions for auction, trade response, and jail decision.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: recent recovery recaps read more like game context, stale recaps exit more naturally, and mobile player reconnect coverage now includes more pressure phases.

## Impact

- Affected code: recovery recap copy and dismissal presentation, mobile reconnect regressions.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.