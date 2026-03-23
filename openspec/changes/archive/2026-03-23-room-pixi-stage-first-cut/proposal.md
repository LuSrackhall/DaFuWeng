## Why

The room shell now behaves more like a game surface, but the board itself is still a DOM placeholder. That means the page hierarchy improved while the main stage still lacks real visual presence.

This slice moves the board to a first real Pixi cut so players can immediately read piece positions, turn focus, and tile focus from the stage itself.

## What Changes

- Replace the DOM board placeholder with a Pixi-based stage inside the existing BoardScene boundary.
- Render the outer ring, center stage area, player tokens, current-focus highlighting, and basic ownership accents through Pixi.
- Keep dense management interactions in DOM surfaces outside the canvas.

## Capabilities

### New Capabilities
- `web-game-client`: The room board is now rendered through a Pixi stage instead of a static DOM tile grid.

### Modified Capabilities
- `web-game-client`: The board stage now carries visible turn focus, player positions, and tile highlighting directly in the scene.

## Impact

- Affected code: board scene rendering, board scene layout helpers, board container styling, and room-entry e2e coverage.
- APIs and persistence: no backend or protocol changes are required.
- Systems: playable room board rendering only.
