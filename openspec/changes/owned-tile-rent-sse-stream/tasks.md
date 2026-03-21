# Tasks

## 1. OpenSpec And Contracts

- [x] 1.1 Add proposal, design, delta specs, and tasks for the owned-tile-rent-sse-stream change.
- [x] 1.2 Extend shared contracts with rent event metadata and stream envelope types.

## 2. Backend Rent Settlement

- [x] 2.1 Resolve owned-tile rent transfers during authoritative roll processing.
- [x] 2.2 Persist rent transfer metadata in ordered room events.

## 3. SSE Room Stream

- [x] 3.1 Add a thin SSE endpoint for room events with sequence-aware snapshot fallback.
- [x] 3.2 Broadcast newly committed room events to active room subscribers.

## 4. Frontend Projection

- [x] 4.1 Add room event stream subscription support in the frontend network layer.
- [x] 4.2 Apply streamed events with deduplication, gap detection, and catch-up fallback.
- [x] 4.3 Surface realtime rent settlement in the room UI.

## 5. Verification

- [x] 5.1 Add backend tests for owned-tile rent settlement and SSE catch-up behavior.
- [x] 5.2 Add projection tests for streamed event application and fallback.
- [x] 5.3 Add end-to-end coverage for dual-page rent synchronization and refresh recovery.