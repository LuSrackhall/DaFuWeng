## Why

The reconnect success strip now carries better context, but it is still easy to miss on mobile and during rapid repeated recoveries.

The current reconnect-success display state is also too weak for repeated events because it uses a plain string flag.

## What Changes

- Upgrade reconnect success display state to a tokenized frontend event.
- Improve reconnect success strip perceptibility with minimal visual and timing adjustments.
- Add regressions for mobile perceptibility and repeated recovery refresh.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: reconnect success feedback is easier to notice and refreshes correctly across repeated recoveries.

## Impact

- Affected code: reconnect notice state, reconnect success strip styling, Playwright reconnect regressions.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.