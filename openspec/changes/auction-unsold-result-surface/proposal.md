## Why

The room page now gives live auctions a clear dominant stage, but a no-sale ending still disappears into the event stream. When an auction ends unsold, players need an explicit result that tells them the room is not stuck, nobody bought the lot, and the game has already moved on.

## What Changes

- Add a readable unsold-auction result summary derived from the existing authoritative event stream.
- Reuse the room page's recent-result surface to explain that the lot remained unsold and no ownership changed.
- Extend projection tests so `auction-ended-unsold` is covered as a visible player-facing result.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now surfaces a clear recent result when an auction ends without a winner.

## Impact

- Affected code: frontend projection summary logic and frontend tests.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web multiplayer auction result readability.