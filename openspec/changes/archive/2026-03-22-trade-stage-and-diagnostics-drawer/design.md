## Context

Trade is already authoritative and reconnect-safe enough to function, but the current room page presents it as a low-level payload editor and response block. That means a rule-complete system still feels incomplete in practice because players cannot easily answer three questions: who is waiting on whom, what exactly is being exchanged, and what happens after accept or reject.

The room page also still exposes technical metadata inline with player-facing guidance. Snapshot version, event sequence, and deck counters are useful for diagnosis, but they should not compete with the current room stage on the main surface.

## Goals / Non-Goals

**Goals:**
- Promote pending trade into a readable dominant stage when the room is waiting for a response.
- Make trade content legible for proposer, counterparty, and observers without exposing raw asset identifiers as the primary UI.
- Move technical room state into a collapsible diagnostics drawer.
- Keep the implementation frontend-only unless an absolute contract gap is found.

**Non-Goals:**
- No multi-party trades, no counter-offers, no negotiation history, no trade chat.
- No protocol redesign, no new backend events, and no persistence schema changes.
- No full room-page rewrite or generalized debugging console.

## Decisions

### 1. Derive a trade summary view-model from the existing projection

The frontend will build a human-readable trade summary from `pendingTrade`, player state, board config labels, and recent events.

Why:
- Existing truth already contains the trade payload.
- This keeps the backend contract stable and localizes the change to frontend projection.

### 2. Treat trade as a room stage, not a side form

When `awaiting-trade-response` is active, trade becomes the dominant stage card. It must clearly identify proposer, counterparty, offered assets, requested assets, and who can act now.

Why:
- A room-level pause should look like a room-level pause.
- This aligns trade with the stage treatment already applied to auction and forced resolutions.

### 3. Introduce a diagnostics drawer instead of inline technical cards

Technical metadata stays available through a collapsible drawer rather than living in the main status grid.

Why:
- It lowers debug-panel feel without deleting useful operational context.
- It lets advanced users and developers inspect state without polluting the primary player surface.

### 4. Keep proposal editing minimal and readable

This slice will not redesign the entire trade editor. It will keep the existing inputs but present a stronger readable summary and clearer response state.

Why:
- The user asked to keep executing high-value slices end to end.
- Replacing raw input editing with richer selectors can happen later without blocking a readable trade stage now.

## Risks / Trade-offs

- [Trade summary diverges from payload reality] -> Build all labels from authoritative payload and board config, and cover them with projection tests.
- [Diagnostics drawer becomes a second cluttered panel] -> Keep it collapsed by default and scoped to current-room technical state only.
- [Trade editor still feels partially technical] -> Accept this for now as long as the main trade stage explains the exchange clearly.

## Migration Plan

1. Add OpenSpec deltas for trade stage readability and diagnostics drawer behavior.
2. Extend the projection with trade summary and diagnostics view-model helpers.
3. Refactor the room page so trade becomes the dominant stage card when pending.
4. Move technical cards and logs into a collapsible diagnostics drawer.
5. Validate with lint, frontend tests, backend tests, and Playwright before commit and push.

## Open Questions

- Whether a future slice should replace raw trade ID entry with asset chips and selectors.
- Whether diagnostics should later gain filtering by event kind once more room stages are polished.
