## Why

The room page now has a stronger shell and a real Pixi board stage, but players can still lose time searching for the one action that actually advances the room.

Primary actions are still split across stage cards, contextual cards, and secondary tools. The next slice should fix that by giving the room rail a stable action anchor.

## What Changes

- Add a fixed primary action anchor card at the top of the room rail.
- Route the current actor, current required action, and immediate consequence summary through that anchor.
- Keep trade drafting, asset overviews, and diagnostics as secondary content.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room rail now exposes a stable primary action anchor across routine and stage-owned room states.

## Impact

- Affected code: room page action hierarchy, room rail styling, and room-flow Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: room-side interaction hierarchy only.
