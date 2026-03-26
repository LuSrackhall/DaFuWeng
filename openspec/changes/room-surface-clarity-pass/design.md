# Design

## Context

The current room shell already has the right building blocks:

- a board stage as the main visual play area
- a primary action rail for room decisions
- a floating event feed for recent context

The issue is not missing information. The issue is that several areas still claim equal importance at the same time.

## Goals / Non-Goals

**Goals**

- reduce desktop multi-focus competition during active-turn and property-decision states
- make mobile spectator view show board context earlier
- keep changes small and local to layout and presentation weight
- preserve all existing room semantics and interaction paths

**Non-Goals**

- no component-tree rewrite
- no rule changes
- no event-model changes
- no large visual redesign of the board or room rail

## Decisions

### 1. Add a compact event-feed mode for high-attention states

When the room is in desktop active-turn or property-decision states, the event feed should shift into a compact supporting mode.

That mode should:

- prioritize the latest event only by default
- shorten explanatory copy
- reduce width and visual weight
- stay expandable through the existing settings toggle

Why:

- this preserves recent-context access without letting the event feed compete equally with the primary action rail

### 2. Reorder mobile spectator layout to surface the board earlier

When the room is viewed as a spectator on the mobile tray layout, the board should appear before the full room rail.

Why:

- spectators first need to understand current action and board context, not scan a long passive metadata stack

### 3. Lower duplicated support information in mobile spectator rail

Mobile spectator rail should keep essential overview and roster context but lower duplicated summary blocks.

Why:

- top pills and board hero already communicate current turn and room phase
- duplicating the same metadata too early increases scan cost without adding understanding

## Implementation Plan

- Add a `room-shell__layout--mobile-spectator` modifier in `GamePage.tsx`.
- Add a compact event-feed state in `GamePage.tsx` for desktop primary-action moments and mobile spectator review.
- Add CSS order overrides and compact feed styling in `App.css`.
- Re-run the screenshot evidence lane and inspect the new images.

## Validation Strategy

- run `pnpm test:e2e:ui-review`
- inspect desktop active-turn, desktop property-decision, and mobile spectator screenshots again
- confirm that current-action focus is clearer and board context appears earlier on mobile spectator