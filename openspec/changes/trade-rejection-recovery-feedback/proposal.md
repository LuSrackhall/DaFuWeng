## Why

The trade flow is now clear before submission, while waiting for a response, and after an accepted result. A rejected trade still falls back to a generic result message, which makes the aftermath feel thinner and less trustworthy than the rest of the trade loop.

That leaves players able to tell that the offer failed, but not able to immediately see that the room is no longer paused, that no assets moved, and that the proposer has resumed control.

## What Changes

- Turn rejected trades into a dedicated recovery-oriented result card.
- Make the rejected trade event carry the full trade snapshot needed for replay-safe recovery feedback.
- Emphasize that no cash, property, or card transfer occurred.
- Extend backend, projection, and browser coverage for the richer rejected-trade result.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Rejected trades now render as a dedicated recovery result card instead of only a generic recent-result summary.

## Impact

- Affected code: shared trade event payload usage, backend reject-trade event emission, frontend projection shaping, room-page result rendering, and automated tests.
- APIs and persistence: no new command shape is required, but rejected trade events now emit the existing trade snapshot fields for replay-safe recovery.
- Systems: rejected trade result rendering and reconnect-safe trade recovery on the web room page.