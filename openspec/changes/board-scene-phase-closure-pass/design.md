## Context

Previous passes taught the board how to explain movement, consequences, turn handoff, and active multi-party pressure stages, but the scene still fell back too abruptly once those stages ended.

This pass focuses on the short bridge from a resolved high-pressure stage into the resumed main turn flow.

## Goals / Non-Goals

**Goals:**
- Explain when auction, trade response, or deficit recovery has fully closed.
- Tell players what authoritative result landed and where the room resumed.
- Keep the closure cue short, semantic-first, and non-blocking.
- Preserve all existing contracts, room-shell actions, and result cards.

**Non-Goals:**
- No backend or contract changes.
- No new gameplay phases, confirmations, or replay layers.
- No room-shell redesign.
- No attempt to model every possible economic or bankruptcy outcome in one pass.

## Decisions

### 1. Introduce a dedicated BoardPhaseClosureCue

GamePage will derive a dedicated closure cue from authoritative settlement or terminal stage events.

Why:
- Closure semantics are different from active phase focus and from ordinary result feedback.

### 2. Keep closure read-only and short-lived

BoardScene will render a compact closure panel that summarizes the result and the resumed stage.

Why:
- Players need a bridge, not another waiting layer or decision surface.

### 3. Reuse authoritative resume context

The closure cue will reuse the current authoritative turn state and pending action label to explain where the room resumed.

Why:
- The board must not invent synthetic recovery stages or second-guess the server.

### 4. Extend semantic summaries for closure validation

The board host aria summary will append concise phase closure context.

Why:
- This provides a stable truth source for automation and accessibility.

## Risks / Trade-offs

- [Closure information could duplicate existing result cards] -> Acceptable because closure focuses on resume context while result cards focus on the outcome itself.
- [Auction settlement may be followed by turn advance immediately] -> Acceptable because the closure cue is derived from the latest relevant authoritative event, not only the newest event.
- [Deficit recovery lacks a dedicated settlement type] -> Acceptable because this pass only narrates the exit from the supported deficit state when an authoritative payment result is visible.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard auction settled/unsold, trade accepted/rejected, and deficit recovery closure summaries through e2e semantic assertions.