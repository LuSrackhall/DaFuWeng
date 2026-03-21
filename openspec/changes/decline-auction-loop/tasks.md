# Tasks

## 1. OpenSpec And Contracts

- [x] 1.1 Add proposal, design, delta specs, and tasks for the decline-auction-loop change.
- [x] 1.2 Extend shared contracts with pending auction state, auction commands, and auction event types.

## 2. Backend Auction Loop

- [x] 2.1 Persist pending auction state in room snapshots.
- [x] 2.2 Start an auction instead of advancing immediately after decline.
- [x] 2.3 Implement bid, pass, settlement, and no-sale outcomes.

## 3. Frontend Projection And UI

- [x] 3.1 Add API support for auction bid and pass commands.
- [x] 3.2 Update projection logic to apply auction events and recovery snapshots.
- [x] 3.3 Render the authoritative auction controls for the active bidder.

## 4. Verification

- [x] 4.1 Add backend tests for decline-to-auction, winning bid settlement, and no-sale flow.
- [x] 4.2 Add projection tests for auction events and recovery.
- [x] 4.3 Add end-to-end coverage for decline, bid or pass, settlement, and refresh recovery.