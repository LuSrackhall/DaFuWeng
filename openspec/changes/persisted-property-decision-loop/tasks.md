# Tasks

## 1. OpenSpec And Shared Contracts

- [x] 1.1 Add proposal, design, delta specs, and tasks for the persisted property decision loop.
- [x] 1.2 Extend shared contracts with pending property metadata, property decision commands, and sequence catch-up responses.

## 2. Durable Persistence

- [x] 2.1 Replace the in-memory PocketBase adapter with durable collection-style persisted records.
- [x] 2.2 Add restart-safe recovery for room snapshots, ordered events, and idempotency records.

## 3. Backend Property Decision Loop

- [x] 3.1 Update roll resolution to enter authoritative property decision state for unowned purchasable tiles.
- [x] 3.2 Implement `purchase-property` with affordability and ownership validation.
- [x] 3.3 Implement `decline-property` and advance the room to the next roll state.

## 4. Frontend Recovery And Decision UI

- [x] 4.1 Add API support for property decision commands and event catch-up reads.
- [x] 4.2 Update projection and room UI to render pending property decisions from backend truth.
- [x] 4.3 Apply sequence-based catch-up and snapshot fallback in the web client.

## 5. Verification

- [x] 5.1 Add backend tests for purchase, decline, invalid commands, and restart recovery.
- [x] 5.2 Add projection or frontend tests for property decision rendering and catch-up recovery.
- [x] 5.3 Add end-to-end coverage for roll to purchasable tile, property decision, and incremental room recovery.