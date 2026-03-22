## Context

The room page has already gained clearer waiting-room and deficit or bankruptcy summaries, but the auction step remains a weak link. The backend already exposes all core auction truth through `pendingAuction`, `currentTurnPlayerId`, `pendingActionLabel`, and recent events. The gap is in presentation and derived explanation, not in rules or transport.

The current sidebar still mixes top-priority stage information with lower-priority debug-like data. Auction suffers most because it competes visually with trade forms, asset summaries, logs, and other controls, making a live contest read like a generic side form.

## Goals / Non-Goals

**Goals:**
- Promote auction into a single readable stage card that explains the current lot, the price leader, the acting bidder, and who has already exited.
- Reduce room-page debug-panel feel by introducing a clearer room overview layer above the active stage card.
- Keep the implementation frontend-only unless an absolute contract gap is discovered.
- Preserve refresh and live-update coherence for auction viewers.

**Non-Goals:**
- No timer-based auctions, automatic bidding, configurable bid ladders, or hidden bids.
- No new backend events, no new persistence fields, and no protocol redesign.
- No full room-page rewrite, no Pixi board overhaul, and no broader asset-management redesign.

## Decisions

### 1. Derive an auction summary view-model from the existing projection

The frontend will build an explicit auction summary from existing snapshot fields instead of adding presentation-specific backend fields.

Why:
- Existing truth is already sufficient.
- This keeps contracts stable and limits the change to the web client surface.

### 2. Make the active stage card singular and role-aware

At any given time, the sidebar should emphasize one dominant stage: waiting room, auction, deficit, trade response, or recent settlement. Auction gets precedence while it is active.

Why:
- The player should never have to ask which panel matters right now.
- This reduces perceived clutter without deleting secondary data.

### 3. Add fast-path auction controls without changing the bid model

The acting bidder will see a direct price field plus quick bid increments derived from the current highest bid. Other players see a read-only explanation of why they cannot act.

Why:
- It increases clarity and speed without inventing a new server-side bidding rule.
- It keeps the existing `submitAuctionBid(amount)` contract intact.

### 4. Lower the visual priority of technical state

Snapshot version, event sequence, and similar technical metadata stay available but should not compete with the active stage and room overview.

Why:
- The room should feel like a live table, not a debugging console.

## Risks / Trade-offs

- [Auction summary drifts from actual backend meaning] -> Keep all display values derived from `pendingAuction`, `currentTurnPlayerId`, and `recentEvents`, and cover them with projection tests.
- [Quick-bid controls imply unsupported server-side bid rules] -> Derive them as simple client suggestions while still submitting explicit absolute amounts.
- [Room-page polish regresses other stage cards] -> Keep the stage-card pattern shared and validate waiting-room and read-only flows in Playwright.

## Migration Plan

1. Add OpenSpec deltas for auction state readability and room-page stage treatment.
2. Extend the projection with an auction summary and stage-priority helpers.
3. Refactor the room page sidebar into room overview, stage card, and support sections.
4. Add quick bid increments and read-only explanations.
5. Validate with lint, frontend tests, backend tests, and Playwright before commit and push.

## Open Questions

- Whether a future release should move technical metadata into a collapsible diagnostics drawer.
- Whether auction should eventually gain richer seat chips or avatar treatment once room identity visuals mature further.