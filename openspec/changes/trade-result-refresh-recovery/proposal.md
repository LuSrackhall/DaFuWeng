## Why

Accepted and rejected trades already render dedicated result cards, and their data is replay-safe enough for current flows. What is still missing is browser-level evidence that a joined player can refresh after the result appears and still land on the same conclusion.

Without that evidence, a key trust moment in multiplayer remains unproven.

## What Changes

- Extend browser coverage for accepted-trade refresh recovery.
- Extend browser coverage for rejected-trade refresh recovery.
- Prove that a joined player reloads into the correct result card and next-step state.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Trade result recovery after browser reload is now covered for accepted and rejected outcomes.

## Impact

- Affected code: Playwright trade-result coverage and OpenSpec artifacts.
- APIs and persistence: no backend or protocol changes are required in this slice.
- Systems: browser-level recovery of accepted and rejected trade result cards after page reload.