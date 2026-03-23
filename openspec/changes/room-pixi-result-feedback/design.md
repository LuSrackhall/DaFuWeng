## Context

The room board already highlights current turn, focused tile, ownership, and stage-state signals.

The next gap is result readability: the board should explain recent authoritative outcomes without forcing players to reconstruct them from side-panel cards.

## Goals / Non-Goals

**Goals:**
- Make the center HUD reflect the latest authoritative result when one exists.
- Surface recent dice and the next room responsibility directly in the board HUD.
- Lock the new behavior with a board-level Playwright assertion.

**Non-Goals:**
- No long-path movement animation.
- No camera choreography or cinematic transitions.
- No protocol, backend, or projection schema changes.

## Decisions

### 1. Derive board feedback from existing room projection data

The room page should derive a compact board feedback object from existing projection data and pass it into the board scene.

Why:
- This keeps the board as a pure presentation consumer and avoids re-parsing event history inside Pixi.

### 2. Let the center HUD temporarily prioritize recent results

When a recent authoritative result exists, the center HUD should show that result title and consequence before falling back to the normal turn banner.

Why:
- Players need to understand outcomes before they can understand the next action.

### 3. Keep the feedback concise and information-first

The board should show result title, result detail, dice, and next-step handoff using a small number of visual signals.

Why:
- This preserves readability and avoids turning the board into a notification surface.

## Risks / Trade-offs

- [The board feedback reuses existing recent-result heuristics] -> Acceptable because this cut focuses on visibility, not new result modeling.
- [Some non-formal results are still summarized heuristically from the latest event] -> Acceptable because the goal is clarity on the common paths, not a complete event dramaturgy system.

## Migration Plan

1. Add OpenSpec artifacts for room Pixi result feedback.
2. Derive compact board feedback in GamePage from existing projection data.
3. Update BoardScene center HUD and semantic label to include recent result feedback.
4. Add Playwright coverage for board-level result semantics.
5. Verify lint and E2E remain green.