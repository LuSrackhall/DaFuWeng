## Context

Accepted and rejected trade results now survive a browser reload for the proposer. The remaining trust gap is whether the same recovery guarantee holds for the responder and for read-only spectators.

This slice closes that evidence gap without redesigning the recovery model.

## Goals / Non-Goals

**Goals:**
- Prove responder reload recovery for accepted and rejected trade results.
- Prove spectator reload recovery for accepted and rejected trade results.
- Confirm that reload does not return either view to the pending trade stage.

**Non-Goals:**
- No backend or contract changes.
- No heavier reconnect or service-restart recovery redesign.
- No UI changes.

## Decisions

### 1. Reuse the existing live trade result flows

The existing accepted and rejected live trade tests already build the necessary room states and page roles.

Why:
- This keeps the evidence close to real multiplayer behavior.
- It minimizes duplicated setup.

### 2. Validate both consistency and role state after reload

Responder and spectator must recover the same result conclusion while preserving their own role semantics.

Why:
- Multi-view consistency is the real value of this slice.
- A spectator that reloads into the wrong role or wrong stage is still a multiplayer bug even if the text looks similar.

## Risks / Trade-offs

- [Playwright runtime grows slightly] -> Acceptable because this is direct multiplayer recovery evidence.
- [This still does not prove heavier reconnect or persistence scenarios] -> Acceptable because those are explicitly separate slices.

## Migration Plan

1. Add OpenSpec deltas for multi-view trade result refresh recovery.
2. Extend accepted trade live coverage with responder and spectator reload assertions.
3. Extend rejected trade live coverage with responder and spectator reload assertions.
4. Validate with lint and Playwright.