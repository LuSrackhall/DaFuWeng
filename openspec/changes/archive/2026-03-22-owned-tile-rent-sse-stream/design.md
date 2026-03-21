## Context

The authoritative room flow currently supports unowned property decisions and durable recovery, but not the first owned-property economy loop. When a player lands on a property another player owns, the backend should settle rent immediately and advance the room without waiting for another command.

The synchronization model also has a clear next step. Ordered events and catch-up already exist, which means server-sent events can be introduced as a thin live delivery layer without replacing the durability or recovery model underneath.

## Goals / Non-Goals

**Goals:**
- Settle rent authoritatively for owned rentable tiles.
- Broadcast committed room events through SSE using the same sequence guarantees as catch-up reads.
- Keep the client projection reconnect-safe by combining live stream, sequence catch-up, and snapshot fallback.
- Verify multi-view synchronization for rent settlement and refresh recovery.

**Non-Goals:**
- Auction flows after decline.
- Card decks, jail, bankruptcy, or mortgage rules.
- Presence, chat, or generalized realtime infrastructure.
- Replacing catch-up reads entirely.

## Decisions

### 1. Rent settlement happens inside roll resolution
Landing on an owned rentable tile is not a second command. The backend resolves the rent transfer during the authoritative `roll-dice` command and emits rent settlement events before turn advancement.

### 2. The SSE stream reuses room event sequences
The stream does not invent new payload shapes. It emits committed room events in sequence order and may emit a snapshot fallback when the subscriber's requested sequence is stale or unsafe.

### 3. Polling remains as fallback while SSE becomes the preferred live path
The frontend listens to SSE first, but still retains catch-up and whole-snapshot refresh when the stream disconnects, misses events, or cannot reconcile safely.

### 4. Rent transfer metadata is explicit in the event payload
Rent events include payer, owner, rent amount, and post-transfer cash values so the projection layer does not have to infer economic deltas from separate player mutations.

### 5. Bankruptcy remains a later slice
If rent causes negative cash in the current simplified model, that state is persisted and visible, but no bankruptcy resolution is attempted in this change.

## Risks / Trade-offs

- [Double-applying streamed and polled events] → use event ids and sequences for deduplication and preserve snapshot fallback.
- [A stale SSE subscriber starts too far behind] → emit a snapshot envelope first, then continue with live events.
- [Rent rules drift from board data] → derive price and rent from the same tile helper used by deterministic tests.
- [Adding SSE complicates test reliability] → keep the stream thin and verify it with deterministic integration plus Playwright dual-page coverage.

## Migration Plan

1. Extend contracts and OpenSpec deltas for rent and room event streaming.
2. Add rent settlement metadata to backend event persistence and room roll resolution.
3. Add SSE subscription support in the backend room service.
4. Update frontend projection to consume streamed events with catch-up fallback.
5. Add backend, frontend, and E2E verification for rent settlement and multi-view synchronization.
