## Why

The board can now explain movement, consequences, and turn handoff, but it still under-explains multi-party pressure stages where the room is paused on auction, trade response, or deficit recovery.

Players and spectators should be able to see who currently owns the decision, who is affected, and what pressure is driving the stage without leaving the board.

## What Changes

- Add a structured board phase focus cue for auction, trade response, and deficit recovery.
- Render board-level phase focus context for the active multi-party stage.
- Highlight the active player and affected counterpart within the board scene.
- Extend board semantic summaries so automation can guard phase focus context.

## Capabilities

### New Capabilities
- `web-game-client`: the board can explain active multi-party pressure stages directly inside the scene.

### Modified Capabilities
- `web-game-client`: board semantic summaries now include concise stage focus context for auction, trade response, and deficit recovery.

## Impact

- Affected code: frontend board scene presentation and e2e validation only.
- APIs and persistence: no backend, contract, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.