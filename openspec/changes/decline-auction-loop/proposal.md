## Why

The room loop now covers creating rooms, rolling, buying property, declining property, settling rent, and streaming authoritative events. One critical gameplay branch is still missing: when a player declines an unowned property, the room should move into an auction instead of skipping directly to the next turn.

Without that branch, the property economy still has a major hole and the multiplayer room flow can discard purchasable assets too easily. This change adds the minimum authoritative auction loop with durable recovery and streamed event projection.

## What Changes

- Replace the direct turn advance after property decline with an authoritative auction state.
- Add bid and pass commands with turn-phase validation and idempotency.
- Persist pending auction state in room snapshots so refresh and reconnect remain safe.
- Stream auction events through the existing ordered event and SSE delivery model.
- Expand automated tests for decline, bid, pass, settlement, and refresh recovery.

## Capabilities

### New Capabilities
- `decline-auction-loop`: Enter an auction after a player declines an unowned property and resolve the winner or no-sale outcome.
- `auction-room-state`: Persist pending auction data in the authoritative room snapshot.
- `auction-recovery`: Restore and project auction state consistently across refresh, catch-up, and live streaming.

### Modified Capabilities
- `property-decision-loop`: Declining property now transitions into an auction branch instead of immediately ending the opportunity.
- `room-event-stream`: Auction commands and settlements are now streamed through the existing live room event flow.

## Impact

- Affected code: `backend/internal/rooms/`, `backend/internal/pocketbase/`, `packages/contracts/`, `frontend/src/network/`, `frontend/src/state/`, `frontend/src/features/`, and validation suites.
- Affected systems: room state transitions, property economy, reconnect-safe snapshots, and streamed multiplayer synchronization.
- Affected APIs: decline handling, auction commands, room snapshots, and authoritative event payloads.