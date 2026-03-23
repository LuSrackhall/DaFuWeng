## Why

The room Pixi board now reads current turn, ownership, and focus well enough, but it still under-explains what just happened.

Players often have to rely on side-panel text to understand the latest dice result, landing outcome, cash consequence, or handoff to the next actor.

## What Changes

- Add stage-level result feedback to the Pixi board center HUD.
- Surface recent dice, result title, and next-step consequence directly on the board.
- Add Playwright coverage that confirms board semantics reflect formal result feedback.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The Pixi room board now explains recent authoritative results instead of only showing static turn and tile state.

## Impact

- Affected code: room board presentation, room page feedback derivation, Playwright result assertions.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.