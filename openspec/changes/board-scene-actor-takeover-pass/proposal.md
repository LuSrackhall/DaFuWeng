## Why

The board can already explain active pressure, closure, and next steps, but it still leaves some of the most stressful states visually under-specified while they are still unresolved.

Players should be able to tell who is currently taking over the board, why the room is still under pressure, and whether the economic chain is still open.

## What Changes

- Add a dedicated board actor takeover cue for unresolved high-pressure states.
- Extend board phase focus cues with a concise chain brief for supported unresolved pressure loops.
- Cover jail failure hold, player-creditor bankruptcy transfer, and unresolved economic-chain recovery.
- Extend semantic summaries so automation can guard takeover plus unresolved-chain context.

## Capabilities

### New Capabilities
- `web-game-client`: the board can explicitly mark the current pressure owner during supported unresolved high-pressure states.

### Modified Capabilities
- `web-game-client`: board phase focus cues now include concise chain-brief context for supported unresolved pressure loops.

## Impact

- Affected code: frontend board scene presentation and e2e validation only.
- APIs and persistence: no backend, contract, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.