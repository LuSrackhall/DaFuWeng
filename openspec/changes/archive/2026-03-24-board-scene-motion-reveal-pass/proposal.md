## Why

The first board experience pass improved the roll entrance and reduced center-HUD pressure, but the board still under-explains the most important transition in the game: a confirmed roll turning into visible movement, a final landing space, and the next consequence.

Without a clearer reveal chain, multiplayer trust and readability still depend too heavily on text instead of the board itself.

## What Changes

- Add a stronger authoritative dice-reveal transition inside the Pixi board scene.
- Animate a single-player stepwise token move when the authoritative state clearly supports it.
- Add a clearer landing highlight and result handoff inside the board scene.

## Capabilities

### New Capabilities
- `web-game-client`: the board can visually explain a confirmed roll through reveal, movement, landing, and handoff inside the Pixi scene.

### Modified Capabilities
- `web-game-client`: BoardScene now consumes a structured transition hint derived from the authoritative projection.

## Impact

- Affected code: frontend board scene presentation only.
- APIs and persistence: no backend, protocol, or rules changes.
- Systems: BoardScene rendering and GamePage scene cue mapping.