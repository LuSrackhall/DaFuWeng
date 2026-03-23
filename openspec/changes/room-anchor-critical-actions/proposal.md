## Why

The room page now has a stable primary action anchor, but two of the highest-pressure states still force players to leave the anchor to actually advance the room.

Auction and deficit recovery still hide their decisive buttons in lower detailed panels. The next slice should let the anchor carry the shortest valid action path for these states.

## What Changes

- Move auction bid submission and pass controls into the primary action anchor.
- Move the shortest deficit-recovery action and bankruptcy action into the primary action anchor.
- Keep detailed comparison and supporting information in the lower stage cards.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The primary action anchor now carries decisive controls for auction and deficit-recovery states.

## Impact

- Affected code: room action anchor behavior, high-pressure stage hierarchy, and room-flow Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: room-side action hierarchy only.