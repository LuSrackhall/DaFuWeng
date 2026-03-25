## Why

The board can now narrate high-pressure stage focus and closure, but it still leaves some players guessing what the very next authoritative action is after jail release, player-creditor deficit recovery, or a more complex economic chain finishes.

Players and spectators should be able to see not only that a result has landed, but also who now acts next and whether the economic chain is fully closed.

## What Changes

- Extend board phase closure cues with explicit next-step guidance.
- Add closure guidance for jail release outcomes, player-creditor deficit recovery, and complex economic chain settlement.
- Render clearer next-step guidance inside the board closure surface.
- Extend semantic summaries so automation can guard closure plus next-step context.

## Capabilities

### New Capabilities
- `web-game-client`: the board can narrate the next authoritative action after supported high-pressure closures.

### Modified Capabilities
- `web-game-client`: board phase closure cues now explain whether the economic chain has fully closed and what the next action is.

## Impact

- Affected code: frontend board scene presentation and e2e validation only.
- APIs and persistence: no backend, contract, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.