## Why

The board can now explain high-pressure stages while they are active, but it still does not clearly tell players when those stages have fully closed and how the room has recovered back to the main turn flow.

Players and spectators should be able to see that auction, trade response, or deficit recovery has ended, what result became authoritative, and which stage the room has resumed.

## What Changes

- Add a structured board phase closure cue for auction, trade response, and deficit recovery exits.
- Render board-level closure and resume context when a supported high-pressure stage ends.
- Extend board semantic summaries so automation can guard closure and recovery context.
- Reuse existing authoritative result and turn state data without changing backend contracts.

## Capabilities

### New Capabilities
- `web-game-client`: the board can narrate high-pressure stage closure and resume the main turn flow inside the scene.

### Modified Capabilities
- `web-game-client`: board semantic summaries now include concise closure and recovery context for supported stage exits.

## Impact

- Affected code: frontend board scene presentation and e2e validation only.
- APIs and persistence: no backend, contract, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.