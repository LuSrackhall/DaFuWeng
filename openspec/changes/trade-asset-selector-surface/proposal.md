## Why

Trade is now readable as a room stage, but proposing a trade still requires entering internal property and card identifiers. That makes the flow feel like a request editor instead of a negotiation surface, and it keeps one of the most visible multiplayer actions in a half-finished state.

Players should be choosing assets they understand, not memorizing `tile-6` or `chance-jail-card`.

## What Changes

- Replace raw trade asset ID inputs with visible property and card selectors for both sides of the offer.
- Keep the existing bilateral trade summary, but make it update directly from the selected assets.
- Surface non-selectable assets with simple rule-aware explanations instead of forcing players to guess and then fail on submit.
- Extend browser coverage so a real room can propose a trade without typing internal asset IDs.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `player-trade-loop`: Trade proposal now uses readable asset selectors instead of raw identifier entry.
- `web-game-client`: The room page now presents a more complete trade proposal surface with visible asset pools and selection state.

## Impact

- Affected code: frontend trade proposal UI, trade draft state handling, styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web multiplayer trade usability and proposal accuracy.