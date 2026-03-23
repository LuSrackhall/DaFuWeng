## Context

The room Pixi board now surfaces recent results, but the current mapping still promotes every non-danger formal result into a success-like stage treatment.

This is directionally wrong for neutral outcomes such as trade rejection and unsold auctions.

## Goals / Non-Goals

**Goals:**
- Stop neutral room results from inheriting success tone.
- Give neutral results a distinct confirmation-state visual treatment.
- Lock the behavior with projection and end-to-end coverage.
- Keep reload recovery stable enough that neutral-result verification does not collapse into timeout-driven fallback state.

**Non-Goals:**
- No full result copy rewrite.
- No global HUD redesign.
- No broad result-information deduplication pass.

## Decisions

### 1. Treat trade rejection and unsold auction as neutral confirmation

These outcomes should be presented as resolved state transitions, not as victories.

Why:
- They confirm what happened, but they do not reward the player.

### 2. Add a dedicated neutral stage treatment

Neutral results should use calmer board and stage-card styling instead of success greens.

Why:
- Players need emotional accuracy as much as mechanical accuracy.

### 3. Verify both projection tone and rendered semantics

Projection tests should assert neutral settlement tone, while Playwright should assert that the board semantics reflect neutral rejection outcomes.

Why:
- This prevents tone drift in either the data mapping or the rendered presentation.

### 4. Relax the overly aggressive room request timeout

The room snapshot request timeout should be long enough to tolerate local reload and test-environment jitter.

Why:
- Otherwise the client can fall into a false fallback state before the neutral result rendering has any chance to recover.

## Risks / Trade-offs

- [Trade accepted still requires a positive outcome treatment even though projection tone remains neutral] -> Acceptable because the board feedback layer is concerned with player-facing emotional semantics, not raw projection naming.
- [This cut does not remove duplicated result text between board and side rail] -> Acceptable because this slice only fixes emotional correctness.

## Migration Plan

1. Add OpenSpec artifacts for neutral result tone handling.
2. Introduce neutral result tone mapping in GamePage and BoardScene.
3. Add a neutral result card treatment in App.css.
4. Relax the room snapshot timeout to reduce reload abort flakiness.
5. Add projection and Playwright assertions for trade rejection and unsold auction neutrality.
6. Verify lint and tests remain green.