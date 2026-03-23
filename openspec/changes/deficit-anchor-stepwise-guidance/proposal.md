## Why

The primary action anchor already exposes the shortest deficit recovery action, but complex deficits can still feel like a one-step hint instead of a continuous guided path.

When one mortgage is not enough, players should not need to rediscover the next move by scanning the detailed asset panel again.

## What Changes

- Turn deficit anchor copy into explicit stepwise recovery guidance.
- Clarify the next recommended mortgage action and remaining shortfall after each step.
- Add end-to-end coverage for a deficit that requires multiple mortgage steps.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The primary action anchor now guides complex deficit recovery as a continuing path rather than a single-step hint.

## Impact

- Affected code: deficit anchor wording, deficit recovery room flow coverage.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.