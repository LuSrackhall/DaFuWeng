## Why

The room page now explains waiting rooms, forced resolutions, and auctions clearly, but trade still reads like an internal form rather than a live room stage. Players currently see raw player IDs, tile IDs, and card IDs in a dense block, which makes an authoritative two-player trade feel harder to trust than the rule itself.

At the same time, technical state such as snapshot version, event sequence, and deck counters still competes with player-facing guidance in the main room surface. That hurts room quality even when the underlying multiplayer state is correct.

## What Changes

- Add a dedicated trade stage summary derived from the existing authoritative room snapshot.
- Replace raw trade payload reading in the room page with a clearer bilateral exchange preview for proposer, counterparty, and observers.
- Move technical room state into a collapsible diagnostics drawer so the main room surface focuses on player decisions.
- Extend projection and browser coverage so trade proposal, response, and diagnostics visibility stay coherent across live updates and refresh.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `player-trade-loop`: The authoritative trade loop is now surfaced as a readable room stage with clear proposer, responder, exchange summary, and response state.
- `web-game-client`: The room page now gives trade the same stage-oriented treatment as auction and forced resolution, while diagnostics move into a lower-priority drawer.

## Impact

- Affected code: frontend room projection, room page layout, UI state for diagnostics drawer, styles, and frontend tests.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web multiplayer trade readability and room-page information hierarchy.