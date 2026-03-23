## Why

The room route now lazy loads correctly, but its current loading shell is still a thin engineering placeholder.

It does not tell players which room they are entering, what is being synchronized, or whether they will arrive as a player or spectator.

## What Changes

- Productize the room-route loading shell with room context, sync stages, and identity expectations.
- Differentiate player and spectator entry expectations in the loading shell.
- Add slow-network Playwright coverage for route-chunk delay and data-fetch delay as separate layers.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Room-route loading now behaves like a productized room-entry transition instead of a generic placeholder.

## Impact

- Affected code: room route loading shell, shared app styles, room-route Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and test coverage only.