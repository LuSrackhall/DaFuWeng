## Why

The reconnect success strip now confirms that recovery finished, but it still does not tell the user the most important thing about the recovered room state.

The automated suite also covers desktop player reconnect and mobile spectator reconnect, but it still lacks a mobile player reconnect success-flow regression with success-strip timing assertions.

## What Changes

- Add context to the reconnect success strip so it explains the newly recovered room state.
- Add a mobile player reconnect Playwright regression.
- Assert the success strip stays visible briefly and then dismisses after recovery.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: reconnect success feedback now includes recovered room context and stronger mobile player recovery coverage.

## Impact

- Affected code: room reconnect success strip, projection recovery tests, Playwright timing assertions.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.