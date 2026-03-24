## Why

The recent recovery recap now preserves reconnect context, but it still lacks a clear freshness anchor and an automatic way to disappear once the room has truly moved on.

Spectator reconnect coverage also still lacks mobile pressure-phase regressions for auction, trade response, and jail decision.

## What Changes

- Add a recovery freshness anchor to the recent recovery recap.
- Expire stale recovery recaps once authoritative room progress advances.
- Add mobile spectator reconnect regressions for auction, trade response, and jail decision.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: recent recovery recap now indicates which authoritative room state it came from and clears once that state becomes stale.

## Impact

- Affected code: recovery recap state and UI, mobile spectator reconnect regressions.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.