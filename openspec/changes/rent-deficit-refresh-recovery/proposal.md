## Why

The repository already proves that 4-player rooms can recover after refresh and that deficit, mortgage, and bankruptcy capabilities exist in isolation. It still lacks a closed loop for the most critical player-to-player economic failure path: rent that cannot be paid immediately.

Without that loop, multiplayer rooms can restore seat identity and turn context, but they still do not fully prove that a player-to-player debt can pause the room, survive refresh, and cleanly resolve back into the authoritative game flow.

## What Changes

- Define a minimal change for player-to-player rent deficit recovery in the authoritative room flow.
- Scope the slice to the rent-only deficit path and its recovery exits through mortgage or bankruptcy.
- Define a layered validation plan that prefers unit and integration coverage first, then uses one 4-player refresh recovery E2E chain as the final proof.

## Capabilities

### Modified Capabilities
- `deficit-room-state`: refine deficit snapshots for player-creditor rent debt.
- `realtime-projection-recovery`: require refresh-safe recovery during rent deficit handling.

## Impact

- Affected areas: backend rent resolution, deficit snapshots, mortgage and bankruptcy transitions, frontend room projection, automated test strategy.
- Runtime behavior: no implementation yet; this change only defines the next delivery slice.
- Product value: closes the highest-risk multiplayer economic recovery gap before broader deficit sources.