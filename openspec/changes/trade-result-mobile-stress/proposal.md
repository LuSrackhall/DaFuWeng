## Why

Trade waiting, accepted results, and rejected results are now structurally strong on desktop, but the accepted and rejected result cards still lack dedicated mobile stress evidence.

That leaves an important product risk unresolved: the moment a trade lands or fails may still feel cramped, ambiguous, or harder to trust on narrow screens.

## What Changes

- Add mobile-first layout constraints for accepted and rejected trade result cards.
- Ensure long player names and dense result content wrap cleanly on narrow screens.
- Extend Playwright with dedicated mobile result-card stress coverage.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Accepted and rejected trade result cards now preserve readability on narrow mobile screens.

## Impact

- Affected code: frontend result-card styles and Playwright mobile coverage.
- APIs and persistence: no backend, protocol, or storage changes are required.
- Systems: mobile rendering of accepted and rejected trade result cards on the room page.