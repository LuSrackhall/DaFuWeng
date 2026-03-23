## Context

The room page already exposes accepted trades through `latestSettlementSummary`, but the accepted result is still rendered like a generic settlement message. That is adequate for correctness, yet it underserves one of the highest-salience moments in the trade loop: the moment a bilateral agreement actually lands.

This slice strengthens the accepted-trade moment without changing trade resolution rules or payloads.

## Goals / Non-Goals

**Goals:**
- Render accepted trades with a dedicated bilateral settlement card.
- Show asset transfers and post-trade cash landing points for both parties.
- Preserve the room's next-step guidance.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No change to rejected-trade handling in this slice.
- No animation or toast system.

## Decisions

### 1. Enrich `latestSettlementSummary` for accepted trades only

Accepted trades get a structured settlement payload so the room page can render a bilateral card without scraping freeform strings.

Why:
- The projection layer already reconstructs accepted trades from recent events.
- Structured frontend data is safer than parsing presentation strings.

### 2. Keep other settlement types on the generic card

Bankruptcy, rejection, and unsold auction results keep their existing generic settlement card for now.

Why:
- This slice is narrowly about the accepted-trade climax.
- It avoids mixing several visual-system changes into one iteration.

### 3. Put “what changed” before “what happens next”

The accepted-trade settlement card first explains who exchanged what and where cash landed, then reminds the room what step comes next.

Why:
- Players care first about the settlement they just caused.
- The next-step hint remains important but should be secondary to the bilateral result.

## Risks / Trade-offs

- [Accepted trades get a richer card than other results] -> Acceptable because this is currently the highest-value result moment to sharpen.
- [Projection types become slightly more detailed] -> Acceptable because the data still comes from existing authoritative events.
- [The generic settlement card remains in place for other outcomes] -> Intended; broader settlement unification can come later.

## Migration Plan

1. Add OpenSpec deltas for the accepted-trade settlement card.
2. Enrich accepted-trade settlement projection data.
3. Render a bilateral settlement card on the room page.
4. Extend projection and browser coverage.
5. Validate with lint and end-to-end coverage.
