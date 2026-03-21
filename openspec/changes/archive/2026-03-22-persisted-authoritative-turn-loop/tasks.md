# Tasks

## 1. OpenSpec And Contracts

- [x] 1.1 Add proposal, design, and delta specs for the persisted authoritative turn slice.
- [x] 1.2 Extend shared contracts with room snapshot versioning, ordered event metadata, turn phase or pending state markers, and roll request payloads.

## 2. Backend Persistence And Authority

- [x] 2.1 Add a persistence boundary for authoritative room snapshots, room events, and processed idempotency keys.
- [x] 2.2 Update room state handling so snapshots carry `snapshotVersion` and `eventSequence` metadata.
- [x] 2.3 Implement the authoritative `roll-dice` command with current-player validation, idempotency protection, and movement resolution.

## 3. Frontend Projection

- [x] 3.1 Add frontend API support for `roll-dice` requests and authoritative roll responses.
- [x] 3.2 Update room projection hooks and room UI to display live roll results from backend truth.
- [x] 3.3 Preserve refresh-safe projection behavior using the latest authoritative snapshot metadata.

## 4. Verification

- [x] 4.1 Add backend tests for valid roll, invalid roll, and duplicate idempotency replay.
- [x] 4.2 Add frontend or projection tests for authoritative roll result rendering.
- [x] 4.3 Add an end-to-end test for create, join, start, roll, and refresh recovery.