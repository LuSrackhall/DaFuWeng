## Context

Accepted trades already render as a dedicated bilateral settlement card, but rejected trades still use a generic result summary. That asymmetry weakens the trade loop because players receive a strong conclusion when a deal lands and only a weak explanation when a deal fails.

This slice strengthens the rejected-trade aftermath and also removes a replay fragility: today the frontend reconstructs the rejected offer by scanning for an earlier trade proposal event. The rejected event should carry the same offer snapshot directly.

## Goals / Non-Goals

**Goals:**
- Render rejected trades as a dedicated recovery result card.
- Make rejected-trade recovery replay-safe by emitting the existing trade snapshot fields on the rejected event.
- Emphasize that no assets moved and that the proposer's turn resumed.
- Preserve the next-step guidance on the room page.

**Non-Goals:**
- No new command endpoints or request payload changes.
- No counter-offer flow or negotiation tools.
- No acceptance-card redesign in this slice.

## Decisions

### 1. Rejected trades emit the same offer snapshot fields as accepted trades

The backend reject event reuses the existing offered and requested cash, property, card, and snapshotVersion fields.

Why:
- The contracts already support these fields.
- This fixes replay and reconnect safety at the source instead of leaving the frontend dependent on historical proposal lookup.

### 2. The rejected result becomes a recovery card, not a failure banner

The room page frames the rejected outcome around room recovery: the quote failed, nothing changed, and the proposer is back in control.

Why:
- After rejection, the most important information is that the board state did not change.
- The next most important information is who acts next.

### 3. Keep the original quote visible but secondary

The rejected result card still shows the original offer summary, but below the recovery message.

Why:
- Players often want to confirm what was just rejected.
- The quote recap should support the recovery message, not compete with it.

## Risks / Trade-offs

- [Rejected trades become richer than other generic result types] -> Acceptable because rejection is now the last unbalanced trade outcome in the loop.
- [Backend emits more data on trade-rejected events] -> Acceptable because the fields already exist in the event model and improve replay stability.
- [Another specialized settlement card increases UI branching] -> Acceptable because this keeps the trade loop coherent and still leaves non-trade results untouched.

## Migration Plan

1. Add OpenSpec deltas for the rejected-trade recovery card.
2. Emit full trade snapshot fields on rejected trade events.
3. Enrich projection data for rejected-trade recovery.
4. Render a dedicated recovery card on the room page.
5. Extend backend, projection, and browser coverage.