## Context

Trade acceptance and rejection already produce dedicated result cards, and recent changes improved their mobile resilience and player-facing clarity. The remaining gap is proof that a joined player can reload the browser after the result appears and still recover the same room state explanation.

This slice focuses on browser evidence, not protocol redesign.

## Goals / Non-Goals

**Goals:**
- Prove accepted trade results survive a browser reload.
- Prove rejected trade results survive a browser reload.
- Verify that reload does not bounce the player back to a pending trade stage.

**Non-Goals:**
- No backend or contract changes.
- No service-restart recovery redesign.
- No new UI changes.

## Decisions

### 1. Extend existing live trade flows instead of creating new mocks

The accepted and rejected live trade tests already build the correct room states. Reload assertions should piggyback on them.

Why:
- This keeps coverage close to the real multiplayer flow.
- It avoids duplicating setup logic.

### 2. Validate both result card and next-step state after reload

Reload recovery is only credible if the room still shows both the correct result card and the correct resumed room step.

Why:
- The result card alone is not enough if the room accidentally returns to waiting-trade-response.
- The next-step label alone is not enough if the explanation disappears.

## Risks / Trade-offs

- [This does not prove recovery across persisted-history truncation or service restart] -> Acceptable because this slice is intentionally scoped to browser reload evidence only.
- [Playwright runtime increases slightly] -> Acceptable because the added value is direct end-user recovery evidence.

## Migration Plan

1. Add OpenSpec deltas for trade-result browser refresh recovery.
2. Extend the accepted trade browser test with a reload assertion.
3. Extend the rejected trade browser test with a reload assertion.
4. Validate with lint and Playwright.