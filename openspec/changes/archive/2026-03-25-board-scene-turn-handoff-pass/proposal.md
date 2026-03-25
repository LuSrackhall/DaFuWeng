## Why

The board can now explain confirmed movement and key landing consequences, but it still does not clearly bridge one finished turn into the next active player.

Players and spectators should be able to see who now owns the stage, which previous result is fading out, and what the next actionable phase is without depending on side-rail text alone.

## What Changes

- Add a structured board handoff cue for authoritative turn ownership changes.
- Show a board-level handoff bridge when the next player takes control.
- Dim the previous result and consequence layer when a new player receives the turn.
- Extend semantic board summaries so automated tests can guard handoff context.

## Capabilities

### New Capabilities
- `web-game-client`: the board can visually bridge a finished turn into the next active player and next phase.

### Modified Capabilities
- `web-game-client`: board semantic summaries now include concise turn handoff context when the authoritative turn changes.

## Impact

- Affected code: frontend board scene presentation and e2e validation only.
- APIs and persistence: no backend, contract, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.