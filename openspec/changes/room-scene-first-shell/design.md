## Context

The current room page has several valid gameplay surfaces, but they are arranged like a dashboard. The board sits inside a generic panel while room overview, stage cards, tools, assets, and diagnostics compete in one long reading flow.

This slice creates a first real game shell before deeper Pixi work.

## Goals / Non-Goals

**Goals:**
- Remove the room route from the generic brand shell.
- Add a lightweight room top bar that keeps identity and current focus visible.
- Make the board the primary desktop stage while keeping the room rail focused on the active stage and primary action.
- Demote overview, support detail, assets, and diagnostics below the active stage.

**Non-Goals:**
- No Pixi deep integration yet.
- No gameplay rule or protocol changes.
- No redesign of every stage card.

## Decisions

### 1. Split the room route from the lobby shell

The lobby can keep the current product header, but the room route should become its own game shell.

Why:
- The room is not a marketing or onboarding surface.
- A persistent product hero weakens match immersion.

### 2. Use a compact room top bar instead of a global app header

The room top bar keeps room identity, turn focus, and a back path visible without overwhelming the stage.

Why:
- Players still need orientation.
- The top bar should support the stage, not dominate it.

### 3. Reorder the room rail around the current stage

The room rail should lead with the current stage and primary action, then place overview and support detail lower.

Why:
- The current usability problem is mostly hierarchy, not missing data.
- This change improves the room immediately without waiting for full scene animation.

## Risks / Trade-offs

- [Mobile still keeps the active stage ahead of the board] -> Acceptable in this slice because decision reach remains important on narrow screens.
- [The board is still DOM-based] -> Acceptable because this slice is about shell and hierarchy, not final scene technology.

## Migration Plan

1. Add OpenSpec artifacts for the scene-first room shell.
2. Split the room route from the global app shell.
3. Add the room top bar and board hero.
4. Reorder the room rail around the active stage and primary action.
5. Validate with lint and Playwright.