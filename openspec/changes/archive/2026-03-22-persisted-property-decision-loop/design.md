## Context

The persisted authoritative turn loop established versioned snapshots, room event sequences, and idempotent dice rolls. The next missing vertical slice is the first real branch that follows a roll: when a player lands on an unowned purchasable tile, the backend must enter a property decision state and accept either buy or decline from the acting player.

At the same time, room state persistence must become restart-safe instead of process-memory only, and clients need an incremental synchronization path using room event sequences. These three requirements belong together because property decisions are the first rule branch that makes ownership, cash, and recovery correctness observable.

## Goals / Non-Goals

**Goals:**
- Add authoritative buy and decline commands for unowned purchasable tiles.
- Persist room snapshots, events, and idempotency records in a restart-safe collection-style store.
- Add event catch-up reads by `afterSequence` with fallback to authoritative snapshots.
- Update the web client to render pending property decisions and recover from missing events without relying only on full reload.

**Non-Goals:**
- Rent collection for owned properties.
- Auctions, jail, cards, bankruptcy, or full turn settlement.
- Full realtime subscriptions.
- Production-grade PocketBase migrations for every future collection.

## Decisions

### 1. Property decisions are explicit backend commands
Roll resolution and property decisions are separate authoritative commands. `roll-dice` may leave the room in `awaiting-property-decision`, and only the current acting player may submit `purchase-property` or `decline-property` with idempotency protection.

### 2. Pending property metadata lives in authoritative room state
The room snapshot carries the pending tile id, index, label, and price when a buy or decline decision is active. This keeps the client from reverse-engineering rule state from board coordinates alone.

### 3. Persistence uses collection-style durable records
Room snapshots, room events, and processed command results are persisted in durable collection-style records that survive process restart. The Go service remains the only rule engine, while the persistence layer stores committed truth and recovery inputs.

### 4. Event recovery is sequence-based with snapshot fallback
Clients request events after their latest applied `eventSequence`. If the backend can serve a contiguous sequence, the client applies the catch-up. If the sequence is stale, incompatible, or missing, the backend returns the latest authoritative snapshot and the client replaces local projection state.

### 5. Turn progression after buy or decline advances to the next player
This slice advances the room back to `awaiting-roll` for the next player after a successful buy or decline. It does not stop in an indefinite post-decision state because that would leave the main multiplayer loop artificially blocked.

## Risks / Trade-offs

- [Property decision state and board metadata drift apart] → keep pending property details in the snapshot and reuse shared board metadata rules in tests.
- [Durable persistence becomes hard to reset in tests] → make the store path configurable and isolate tests to temporary files.
- [Event catch-up produces duplicated UI transitions] → apply catch-up only when sequences advance and fall back to full snapshot on any gap.
- [The slice accidentally grows into rent logic] → owned-tile landings remain non-rent placeholders in this change.

## Migration Plan

1. Extend contracts with pending property decision state, purchase or decline commands, and event catch-up responses.
2. Replace the process-memory PocketBase adapter with a durable collection-style store.
3. Update room rules to enter property decision state on valid unowned purchasable landings and resolve buy or decline.
4. Add event catch-up APIs and frontend projection recovery paths.
5. Add backend, frontend, and end-to-end verification for purchase, decline, restart recovery, and incremental synchronization.

## Open Questions

- Should the next slice after this one add rent before auctions, or should reconnect or spectator work be prioritized first?
- Should event catch-up remain polling-based on the web client until realtime transport exists, or should a thin SSE bridge be introduced before rent logic lands?
