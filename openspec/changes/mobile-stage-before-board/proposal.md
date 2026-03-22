## Why

The mobile room page now puts the current stage ahead of the overview inside the room-state panel, but the board still appears before the entire decision area. That means players can still enter a room, see the board first, and only then discover that the room is actually waiting on a trade response, an auction bid, or a deficit recovery action.

On mobile, that reading order is backwards. Players should first see what the room needs from them, then inspect the board.

## What Changes

- Reorder the mobile room page so the room-state decision area appears before the board panel on narrow screens.
- Keep the board as the second reading surface on mobile instead of the first.
- Extend browser coverage with a mobile-viewport assertion that the current stage appears before the board.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The mobile room page now presents the current authoritative stage before the board so players reach active decisions faster.

## Impact

- Affected code: frontend room page layout, responsive CSS, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: mobile web room-page decision prioritization.