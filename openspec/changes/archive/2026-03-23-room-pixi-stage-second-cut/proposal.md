## Why

The room board already mounts a Pixi stage, but it still reads like a first technical cut instead of a polished board-game scene.

Players can see positions and highlights, yet the center panel still feels like a placeholder and the stage does not carry enough of the room's turn, focus, and ownership signals by itself.

## What Changes

- Replace the center placeholder panel with a live turn HUD.
- Strengthen tile focus, ownership, and token hierarchy inside the Pixi stage.
- Expose a testable Pixi stage summary so automation can verify current-turn and focus updates.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The Pixi room board now behaves as a richer scene-first board stage instead of a basic canvas placeholder.

## Impact

- Affected code: Pixi board rendering, room-scene readability, and Playwright validation.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.