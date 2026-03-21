# First Playable Milestone

## Goal

Deliver one end-to-end playable multiplayer loop on the web client using the authoritative backend path.

## Follow-up Work

1. Replace sample projection data with a real room snapshot endpoint.
2. Introduce typed room commands for create, join, ready, and start flows.
3. Add realtime event streaming from backend to frontend projection state.
4. Implement authoritative roll-dice and move resolution handlers.
5. Replace static board ownership rendering with live ownership and rent resolution.
6. Add reconnect recovery from snapshot plus sequence metadata.
7. Add Playwright journeys for create room, join room, start game, and first resolved turn.
8. Expand backend rule tests for turn phase validation and idempotency keys.

## Exit Criteria

- two players can enter the same room
- host can start the game
- current player can roll once per turn
- movement and pending purchase state are rendered from backend truth
- reconnect returns the player to the current turn context