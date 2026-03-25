## Why

The project already supports up to four players in the authoritative room service, but current end-to-end evidence is still dominated by two-player flows.

Without real 3-player and 4-player browser validation, room-capacity support remains an implementation claim rather than a proven multiplayer baseline.

## What Changes

- Add Playwright smoke journeys for real 3-player room progression and 4-player room capacity validation.
- Verify that all connected pages converge on the same authoritative turn and room state.
- Verify that a fifth player is rejected once the room is full.

## Capabilities

### Modified Capabilities
- `multiplayer-room-lifecycle`: room-capacity and multi-page synchronization now have real 3-player and 4-player browser validation coverage.

## Impact

- Affected code: frontend Playwright tests and OpenSpec artifacts.
- Runtime behavior: unchanged.
- Product confidence: stronger proof that 3-player and 4-player rooms work in the real browser flow.