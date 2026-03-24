## Why

The new clean e2e lane now exposes three remaining real failures in the Playwright suite.

These failures come from unstable test timing and outdated turn-precondition assumptions, which reduce confidence in the full clean validation gate.

## What Changes

- Replace one fragile mobile spectator reconnect live flow with a deterministic recovery baseline.
- Restore the correct turn preconditions for the live trade response and rejected trade flows.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: the clean full-suite Playwright gate more accurately reflects current authoritative room flow behavior.

## Impact

- Affected code: Playwright end-to-end coverage only.
- APIs and persistence: no gameplay or protocol changes.
- Systems: local and CI-style clean validation confidence.