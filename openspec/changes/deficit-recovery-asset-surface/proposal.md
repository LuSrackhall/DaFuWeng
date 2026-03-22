## Why

The room page already explains why a deficit paused the match, but the recovery actions still collapse into a row of bare buttons. That makes one of the most important multiplayer crisis moments feel like trial and error instead of an understandable recovery decision.

Players need to see how far they are from safety, which assets can help, and what happens after each recovery action.

## What Changes

- Turn deficit recovery into a readable asset panel instead of a button list.
- Show which owned properties can be mortgaged, how much each one returns, and whether that action would clear the remaining shortfall.
- Keep blocked recovery assets visible with a clear reason instead of hiding them.
- Extend room-page browser coverage so a live deficit can be resolved through the new recovery panel.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `deficit-room-state`: The room page now presents deficit recovery actions alongside the debt summary in a readable recovery surface.
- `web-game-client`: The room page now exposes a more complete deficit recovery experience with asset-level recovery guidance.

## Impact

- Affected code: frontend room page deficit stage, styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web multiplayer deficit recovery clarity and usability.