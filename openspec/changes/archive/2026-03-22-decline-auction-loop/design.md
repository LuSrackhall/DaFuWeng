## Context

The current authoritative property loop stops short after a player declines an unowned property. That leaves the property economy incomplete and prevents the game from expressing one of Monopoly's core multiplayer interactions: competing bids for a skipped tile.

The repository now already has durable room snapshots, ordered room events, catch-up recovery, and SSE event delivery. This means auctions can be introduced as another authoritative room phase without inventing new transport or persistence primitives.

## Goals / Non-Goals

**Goals:**
- Start an authoritative auction when a player declines an unowned property.
- Support the minimum viable commands: submit bid and pass.
- Persist pending auction state and recover it after refresh or reconnect.
- Stream auction events through the same sequence and SSE model already used by the room.

**Non-Goals:**
- Mortgage-backed bidding.
- Bankruptcy resolution.
- Timers, auto-bids, bots, or hidden bidding.
- Card, jail, or other tile effect systems.

## Decisions

### 1. Decline transitions into `awaiting-auction`
Property decline no longer advances the room directly. It creates an authoritative pending auction state and rotates bidding order from the next player.

### 2. Auction order is explicit and snapshot-backed
The room snapshot stores the pending tile, initiator, current bidder, highest bid, highest bidder, and passed players. Recovery does not depend on rebuilding auction state from event history alone.

### 3. Bid and pass are explicit commands
Every auction action is a backend command with phase validation and idempotency, matching the existing room command model.

### 4. The auction result settles immediately
When only the winning bidder remains active, or when every player passes without a bid, the backend settles the auction immediately and advances normal turn flow.

### 5. Streaming and catch-up reuse the existing event model
Auction events are ordinary room events with stable sequence ordering. The frontend consumes them through SSE and catch-up without a separate auction transport layer.

## Risks / Trade-offs

- [Auction state drifts across refresh] → persist the whole pending auction snapshot explicitly.
- [Invalid bids create hidden state divergence] → validate bid amount, active bidder, and remaining cash on every command.
- [Streamed auction events double-apply with fallback polling] → keep event id and sequence deduplication in the projection layer.
- [The slice expands into advanced auction rules] → cap scope at fixed-order open bidding with pass and no-sale handling.

## Migration Plan

1. Extend contracts and OpenSpec deltas with auction room state, commands, and events.
2. Persist pending auction state in room snapshots.
3. Replace decline turn-advance logic with auction creation and settlement.
4. Add frontend UI and projection support for bidding and passing.
5. Add backend, frontend, and E2E verification for auction settlement and recovery.
