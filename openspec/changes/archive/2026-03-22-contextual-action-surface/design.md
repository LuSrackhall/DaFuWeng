## Context

The room page already promotes auctions, trades, and deficit recovery into dedicated stage surfaces. The remaining rough spot is the general current-action area, which still keeps a stack of mostly irrelevant controls visible.

This slice focuses on three common states that do not yet have equally clean action framing:

1. Normal turn before rolling.
2. Jail decision.
3. Property purchase decision.

## Goals / Non-Goals

**Goals:**
- Present only the actions relevant to the current room step.
- Make waiting states explicit instead of showing unrelated disabled buttons.
- Absorb property purchase choices into the contextual action surface.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No action-surface redesign for auction, trade, or deficit recovery, because those already have stage-specific surfaces.
- No board tile selection or local context browsing changes.

## Decisions

### 1. Contextualize only the generic action area

The slice will only reshape the current-action card and the nearby property decision controls.

Why:
- This fixes the most obvious action clutter without destabilizing the dedicated stage surfaces.

### 2. Property purchase becomes part of the current action surface

Pending property decisions will no longer duplicate actions in a separate card. The decision and its buttons will live in the contextual action surface.

Why:
- Property purchase is a single blocking decision and fits naturally into a one-focus action card.

### 3. Waiting players see explanation, not dead controls

When the viewer cannot act, the action surface will explain who is acting and what the room is waiting on.

Why:
- Readability improves more by removing dead controls than by styling them differently.

## Risks / Trade-offs

- [Players may miss secondary tools like development or trade initiation] -> Keep those surfaces available below the contextual card without mixing them into the primary action block.
- [Property decision detail becomes too compressed] -> Keep the tile label and price in the contextual action copy.
- [Different stages use slightly different action wording] -> Acceptable because the room state itself is different.

## Migration Plan

1. Add OpenSpec deltas for contextual room-page actions.
2. Refactor the action card to derive one action context from the authoritative room state.
3. Remove duplicated property decision buttons from the separate property card.
4. Add one Playwright scenario for a jail-decision action surface.
5. Validate with lint and end-to-end coverage.