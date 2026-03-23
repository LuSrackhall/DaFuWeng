## Why

The room board now explains recent results, but some neutral outcomes still inherit success-like visual treatment.

That makes players misread outcomes such as a rejected trade or an unsold auction as if they gained momentum or rewards.

## What Changes

- Separate neutral room results from success-like result treatment.
- Give neutral results a calmer confirmation visual in the center HUD and result cards.
- Add targeted regression coverage for neutral settlement tone and board semantics.
- Relax the room snapshot request timeout so reload recovery is less likely to fall into client-side aborts.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Neutral room results now read as confirmed state transitions instead of celebratory success feedback.

## Impact

- Affected code: room result feedback mapping, result card styling, room API timeout handling, projection tests, Playwright assertions.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.