## Context

The recent mobile density slice fixed the order inside the room-state panel, but the page still uses a board-first layout. On mobile, that leaves the visual focus on the board at the exact moment when the player really needs to understand the active room stage.

This slice solves the remaining first-screen priority problem by moving the room-state decision panel ahead of the board on narrow screens.

## Goals / Non-Goals

**Goals:**
- Make the room-state panel appear before the board on narrow mobile screens.
- Preserve the current stage-first hierarchy already established inside the room-state panel.
- Keep the implementation frontend-only.

**Non-Goals:**
- No board or Pixi interaction redesign.
- No protocol, snapshot, or backend changes.
- No new navigation patterns or bottom sheets.

## Decisions

### 1. Reorder whole mobile panels, not just internal cards

On narrow screens the room-state panel becomes the first panel in the reading flow and the board becomes the second panel.

Why:
- This is the smallest coherent change that actually makes the decision surface first.
- It builds directly on the previous stage-priority work instead of inventing a new mobile structure.

### 2. Keep desktop layout unchanged

The desktop two-column layout stays as-is.

Why:
- The first-screen problem is specific to narrow mobile reading flows.
- Desktop already has enough room to present board and room state side by side.

### 3. Lock the behavior with a viewport-level E2E assertion

Playwright will assert that the room-state panel, and specifically the current stage inside it, appears before the board on mobile.

Why:
- This avoids future CSS regressions.
- The behavior is primarily about rendered reading order, so E2E is the right level.

## Risks / Trade-offs

- [Board loses first visual emphasis on mobile] -> Intentional, because decision clarity is more valuable than immediate board spectacle on small screens.
- [More scrolling before the board appears] -> Acceptable if players can act faster and with less confusion.
- [Desktop and mobile diverge further] -> Acceptable because the divergence is purpose-driven and responsive.

## Migration Plan

1. Add OpenSpec deltas for mobile decision-area priority over the board.
2. Tag board and room-state panels for responsive reordering.
3. Adjust mobile breakpoints so room-state precedes board.
4. Add one mobile Playwright assertion for stage-before-board order.
5. Validate with lint and end-to-end coverage.
