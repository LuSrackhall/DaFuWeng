## Why

The proposer already has browser-level reload recovery evidence for accepted and rejected trade results. The remaining gap is whether the responder and spectator recover the same result card and room state after a refresh.

Without that proof, multiplayer result consistency is still incomplete.

## What Changes

- Extend accepted-trade browser coverage for responder and spectator reload recovery.
- Extend rejected-trade browser coverage for responder and spectator reload recovery.
- Prove multi-view result consistency after browser refresh.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Trade result browser recovery is now covered across proposer, responder, and spectator views.

## Impact

- Affected code: Playwright trade-result coverage and OpenSpec artifacts.
- APIs and persistence: no backend or protocol changes are required.
- Systems: browser-level multi-view recovery for accepted and rejected trade result cards.