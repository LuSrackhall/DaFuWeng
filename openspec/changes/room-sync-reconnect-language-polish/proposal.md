## Why

The room sync shell now covers loading and fallback, but the realtime reconnect path still lacks direct end-to-end validation.

At the same time, the sync shell copy still leaks too many engineering terms into a player-facing surface.

## What Changes

- Add a Playwright recovery-path regression for the realtime reconnect error-only branch.
- Rewrite in-page room sync shell copy to sound more like player guidance and less like system diagnostics.
- Keep the reconnect state distinct from first-load and fallback states.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Realtime reconnect now has direct room-page regression coverage and more player-readable sync shell copy.

## Impact

- Affected code: room sync shell copy, projection reconnect error message, Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.