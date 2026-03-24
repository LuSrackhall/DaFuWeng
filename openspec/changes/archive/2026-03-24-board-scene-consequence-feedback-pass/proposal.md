## Why

The board can now reveal confirmed dice results and safe token movement, but it still under-explains what the landing actually caused.

Players and spectators should not need to depend on side-rail text alone to understand whether a landing produced a property purchase, rent payment, tax payment, or jail state.

## What Changes

- Add a structured BoardConsequenceCue for key landing consequences.
- Render a board-level consequence ribbon for property purchase, rent, tax, and jail outcomes.
- Extend board semantic summaries so automated tests and assistive readers can confirm those consequences.

## Capabilities

### New Capabilities
- `web-game-client`: the board can explain key landing consequences directly inside the scene for both active players and spectators.

### Modified Capabilities
- `web-game-client`: the board host semantic summary now includes concise consequence context for key landing outcomes.

## Impact

- Affected code: frontend scene presentation and e2e validation only.
- APIs and persistence: no backend, protocol, or rules changes.
- Systems: GamePage cue mapping, BoardScene rendering, Playwright assertions.