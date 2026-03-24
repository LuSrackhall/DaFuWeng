## Why

The web client now has a stable clean e2e gate, but the live play surface still undersells the core Monopoly loop.

Rolling dice is the main entry into each turn, yet it still reads like an ordinary form action. At the same time, the board loses too much space to surrounding UI, and the center HUD in the Pixi scene remains too heavy and too prone to visual crowding on tighter layouts.

## What Changes

- Upgrade the roll phase into a more theatrical primary action entrance.
- Rebalance board and rail space so the board returns to first-visual priority.
- Reduce and re-layout the center HUD so it behaves like a board broadcast layer instead of a large information panel.

## Capabilities

### New Capabilities
- `web-game-client`: the board can present a stronger roll-stage entrance and a lighter, more resilient center feedback layer.

### Modified Capabilities
- `web-game-client`: board and rail presentation now prioritize the board more aggressively during active play.

## Impact

- Affected code: frontend presentation only.
- APIs and persistence: no gameplay, protocol, or backend changes.
- Systems: GamePage layout, BoardScene rendering, and responsive styling.