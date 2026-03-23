## Why

The room page still feels like a stacked admin console instead of a playable board-game stage.

Players are reading a global app shell and a long room-state panel before they feel like they have entered the match. This weakens visual impact, slows first-turn comprehension, and makes the current Pixi plan feel theoretical instead of real.

## What Changes

- Split the room route out of the global lobby shell.
- Introduce a lightweight room top bar for room identity and current focus.
- Reframe the room page as a scene-first layout where the board stays primary and the room rail prioritizes the active stage before overview and support detail.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now uses a scene-first shell instead of the global lobby shell.

## Impact

- Affected code: room route layout, room page shell, board presentation copy, and end-to-end room entry coverage.
- APIs and persistence: no backend or protocol changes are required.
- Systems: web room layout and interaction hierarchy.