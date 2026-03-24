## Why

The room reconnect path is now covered for player recovery, but spectator recovery still lacks its own regression protection.

At the same time, a few player-facing surfaces in the room page and board layer still sound like internal system tooling instead of a finished game.

## What Changes

- Add a Playwright recovery-path regression for spectator reconnect after realtime failure.
- Keep spectator reconnect strictly read-only before and after recovery.
- Remove more residual engineering wording from the room page and board center panel.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Spectator reconnect is now directly covered, and player-facing room/board copy is more productized.

## Impact

- Affected code: room page copy, board center copy, reconnect recovery tests, OpenSpec artifacts.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.