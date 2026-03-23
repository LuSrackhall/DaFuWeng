## Why

The trade loop is now structurally clear across draft, waiting, acceptance, and rejection, but several player-facing lines still sound like system logs instead of premium board-game feedback.

That keeps the flow understandable, yet the tone shifts between player guidance and implementation language, which reduces the sense of polish.

## What Changes

- Rewrite the core trade-loop copy in a more player-facing, game-host tone.
- Cover trade entry, pre-submit confirmation, waiting-state guidance, and result receipts.
- Preserve the current structure and logic while removing backend-style terms.
- Revalidate the existing browser flow after the copy pass.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The trade loop now speaks with a more consistent player-facing tone.

## Impact

- Affected code: frontend trade-stage and trade-result copy.
- APIs and persistence: no backend, protocol, or storage changes are required.
- Systems: trade composer, pending response stage, and trade result cards on the web room page.
