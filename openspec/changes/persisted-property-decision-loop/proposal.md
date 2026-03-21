## Why

The project now has a real authoritative roll loop, but the first meaningful post-roll rule branch is still missing. After moving a player, the backend cannot yet resolve the common Monopoly decision of buying or skipping an unowned property, and reconnect or multi-view synchronization still depends primarily on whole-snapshot reloads.

The current PocketBase adapter is also still process-memory only, which means restart recovery is not truly validated. This change closes those gaps by adding a real persisted property decision loop, collection-style recovery semantics, and sequence-based event catch-up for clients that fall behind.

## What Changes

- Add server-authoritative `purchase-property` and `decline-property` commands for the first post-roll decision branch.
- Extend authoritative room snapshots with explicit pending property metadata so the client can render buy or decline decisions from backend truth.
- Replace process-memory persistence with collection-style persisted room snapshots, room events, and idempotency records that survive service restarts.
- Add room event catch-up APIs keyed by `afterSequence` so clients can recover incrementally instead of relying only on full snapshot reloads.
- Expand automated verification to cover property purchase, decline, restart recovery, and live event catch-up.

## Capabilities

### New Capabilities
- `persisted-property-state`: Persist property ownership decisions and restore them after service restart.
- `property-decision-loop`: Resolve buy or decline as the first real post-roll gameplay branch.
- `sequence-event-recovery`: Allow lagging clients to request ordered room events after a known sequence and reconcile with authoritative state.

### Modified Capabilities
- `persisted-room-state`: Persisted room state now includes pending property decision metadata and ownership changes.
- `web-turn-projection`: The web client now renders authoritative property decisions and incremental event recovery.

## Impact

- Affected code: `backend/internal/pocketbase/`, `backend/internal/rooms/`, `packages/contracts/`, `packages/board-config/`, `frontend/src/network/`, `frontend/src/state/`, `frontend/src/features/`, and validation workflows.
- Affected systems: room persistence, restart recovery, post-roll room state transitions, and reconnect-safe client synchronization.
- Affected APIs: room snapshots, room event catch-up endpoints, property decision commands, and projection recovery semantics.
- Dependencies: Go service persistence adapter, frontend projection state, Playwright end-to-end coverage, and OpenSpec capability deltas.
