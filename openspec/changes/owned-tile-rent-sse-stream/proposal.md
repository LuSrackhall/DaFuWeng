## Why

The game loop can now create rooms, roll dice, buy or decline unowned property, and recover through snapshots plus sequence catch-up. The next missing multiplayer loop is the first true player-to-player economy transfer: landing on a property another player already owns and paying rent.

At the same time, clients still rely on polling to discover new authoritative events. The repository already has ordered events and catch-up semantics, so the next practical step is to layer a thin server-sent event stream on top of that contract instead of waiting for a full realtime transport redesign.

## What Changes

- Add authoritative rent settlement when a player lands on an owned rentable tile.
- Persist and broadcast rent settlement events with enough metadata for reconnect and spectator-safe projection.
- Add a thin SSE room event stream that reuses room event sequences and snapshot fallback semantics.
- Update the web client to consume authoritative room events from SSE while retaining catch-up fallback.
- Expand automated coverage for rent settlement, multi-view synchronization, and realtime recovery.

## Capabilities

### New Capabilities
- `owned-tile-rent-loop`: Resolve rent collection when a player lands on another player's property.
- `room-event-stream`: Stream authoritative room events over SSE for active room viewers.
- `realtime-projection-recovery`: Reconcile streamed events with sequence-based catch-up and snapshot fallback.

### Modified Capabilities
- `persisted-room-state`: Persisted room events now include rent transfer metadata.
- `web-turn-projection`: The web client now prefers streamed authoritative events and falls back to catch-up when needed.

## Impact

- Affected code: `backend/internal/rooms/`, `backend/internal/pocketbase/`, `packages/contracts/`, `packages/board-config/`, `frontend/src/network/`, `frontend/src/state/`, `frontend/src/features/`, and validation suites.
- Affected systems: turn settlement, event streaming, reconnect recovery, and multi-view authoritative synchronization.
- Affected APIs: roll resolution, room event payloads, SSE room stream endpoint, and frontend projection recovery behavior.