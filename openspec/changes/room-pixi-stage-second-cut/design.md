## Context

The first Pixi cut proved that the room board can render through canvas without breaking the authoritative room loop.

The next value is not more rules in canvas, but a stronger stage that helps players read the room faster.

## Goals / Non-Goals

**Goals:**
- Turn the center panel into a live turn HUD.
- Improve board readability for current actor, focused tile, and ownership state.
- Keep the room page contract stable while improving stage quality.

**Non-Goals:**
- No camera system, free pan or zoom, or long-path token animation.
- No backend or rule changes.
- No migration of complex room actions from DOM into canvas.

## Decisions

### 1. Keep the second cut inside BoardScene

The implementation stays primarily inside BoardScene with local helper functions.

Why:
- This keeps the file surface small and avoids turning a presentation polish pass into a scene-system rewrite.

### 2. Make the center area a live room HUD

The center panel should explain the current actor, current focused tile, and broad board-state counts.

Why:
- The center should become the semantic anchor of the stage, not a placeholder title card.

### 3. Strengthen signals instead of adding spectacle

Ownership bands, focus emphasis, token hierarchy, and board material cues should improve first.

Why:
- Players need faster reading, not heavier effects.

### 4. Add a testable board summary contract

The Pixi host should expose a stable semantic summary for automation.

Why:
- Canvas content is otherwise difficult to validate with Playwright.

## Risks / Trade-offs

- [The stage remains a full redraw renderer] -> Acceptable for this cut because the priority is visual clarity, not a scene-graph architecture rewrite.
- [Automation validates semantic board summary rather than raw pixels] -> Acceptable because it still verifies that the stage follows authoritative room state.

## Migration Plan

1. Add OpenSpec artifacts for Pixi second cut.
2. Upgrade BoardScene rendering structure and center HUD.
3. Add testable Pixi stage summary metadata.
4. Verify lint and Playwright room flows remain green.