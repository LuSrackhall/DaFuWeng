## Context

The foundation change delivered the repository skeleton, room lifecycle shell, CI, release automation, and a minimal authoritative room API. However, gameplay progression still stops at room start. The project now needs the first real state mutation path that proves the backend owns turn progression, that clients can reconnect safely, and that persistence boundaries will not collapse once more rules are layered on top.

This design intentionally stays narrow. It does not add property purchase, rent, jail, cards, or realtime fan-out yet. Instead, it delivers one authoritative gameplay command: roll dice. That command must validate the acting player, apply deterministic movement, persist the new snapshot and event metadata through a backend boundary, and expose enough versioning for clients to recover after stale reads or refreshes.

## Goals / Non-Goals

**Goals:**
- Add one real authoritative turn mutation path for multiplayer rooms.
- Version authoritative room snapshots and ordered room events.
- Persist enough room data to support reconnect-safe recovery through a backend persistence boundary.
- Keep gameplay rule execution in Go instead of moving it into the persistence layer.
- Update the frontend to display real authoritative turn results rather than only room-shell state.

**Non-Goals:**
- Full PocketBase collection schema or production migration strategy for every game system.
- Full event sourcing for all rules.
- Property purchase, rent, cards, jail, bankruptcy, or auction flows.
- Realtime subscription fan-out beyond what is needed for snapshot and event display.

## Decisions

### 1. Each authoritative room mutation increments a snapshot version
Every accepted mutating command increments a room-scoped `snapshotVersion`. The snapshot also carries the `eventSequence` of the newest room event included in that snapshot. This gives the client and future recovery tools a deterministic synchronization marker.

### 2. Each room event uses a single monotonically increasing room-local sequence
Every gameplay mutation appends one or more events to a room-local ordered sequence. This change does not require full event-sourced rebuilds, but it does require ordered event metadata for debugging, recovery, and frontend projection sanity checks.

### 3. Idempotency is mandatory for gameplay commands
The `roll-dice` command must carry an `idempotencyKey`. The backend records processed command results by room and player scope and returns the previously committed authoritative result when the same command is retried. This prevents duplicate movement when clients retry after timeouts or refreshes.

### 4. Persistence remains a backend boundary, not the rule engine
The persistence layer stores room snapshots, appended events, and processed idempotency records. Rule execution, turn validation, dice generation, movement application, and turn advancement remain in Go service logic. PocketBase integration remains an adapter boundary, not the authority.

### 5. Frontend remains a projection of backend truth
The frontend submits commands and re-renders from authoritative snapshots. It may animate dice and movement locally after the backend responds, but it must never decide dice values or final player positions. Refreshing the page must reconstruct the same view from the authoritative snapshot.

## Risks / Trade-offs

- [Version and sequence fields become under-specified] → keep them explicit in contracts and test assertions immediately.
- [Persistence abstraction becomes too shallow to support recovery later] → persist snapshot, events, and idempotency together from the first turn mutation.
- [Frontend accidentally mixes optimistic state with authoritative state] → keep projection logic in a dedicated state hook and leave animations in presentation state.
- [The first turn slice expands into full Monopoly rules] → stop at movement and post-roll pending state; do not implement purchase or rent in this change.

## Migration Plan

1. Extend shared contracts with snapshot metadata, turn phase markers, roll command payloads, and room event records.
2. Update backend room service to use a persistence boundary and store versioned authoritative state.
3. Implement authoritative roll handling with idempotency and ordered events.
4. Update frontend projection hooks and room UI to submit and display roll results.
5. Add automated tests for acceptance, rejection, refresh recovery, and command replay safety.

## Open Questions

- Should roll result randomness stay inside the room service for now, or be abstracted behind a deterministic RNG interface before buy/rent rules land?
- Should the first recovery path expose event replay from a sequence offset now, or only current snapshot metadata with replay reserved for the next slice?