## Why

The room page already explains reconnect problems, but it still lacks an equally clear moment that tells the player or spectator the room has been fully reconnected.

At the same time, spectator reconnect is covered on desktop, but not yet on mobile where layout pressure is higher.

## What Changes

- Add a lightweight reconnect-success feedback after room catch-up recovery completes.
- Add a mobile spectator reconnect Playwright regression.
- Continue polishing the most mechanical waiting copy in the room page and board center panel.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Reconnect recovery now has a clear success acknowledgment and mobile spectator reconnect regression coverage.

## Impact

- Affected code: projection hook, room-page presentation, board waiting copy, Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.