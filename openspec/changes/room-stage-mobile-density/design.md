## Context

The room page already has better stage hierarchy than before, but it was designed from a desktop-first rhythm. On mobile, the same structure creates three concrete problems:

1. The overview card can still appear before the current stage in the main information flow.
2. Trade, auction, and deficit panels still rely on desktop-style paired layouts longer than they should.
3. Dense action rows and asset chips can create scanning friction or horizontal pressure on smaller widths.

This slice fixes the mobile reading order and spacing without changing authority, rules, or board interactions.

## Goals / Non-Goals

**Goals:**
- Ensure the mobile room page emphasizes exactly one current stage surface above overview detail.
- Convert stage internals to mobile-first single-column reading order.
- Keep controls thumb-friendly and remove horizontal overflow risks.
- Keep the implementation frontend-only.

**Non-Goals:**
- No protocol or backend changes.
- No chessboard or Pixi scene interaction redesign.
- No new drawers, tabs, or bottom navigation systems.

## Decisions

### 1. Promote the current stage above the overview on mobile only

Desktop keeps the current visual order. Mobile reorders the room-stage cards so the current authoritative stage appears before the overview card.

Why:
- The stage card is the real decision surface.
- The overview is useful context, but secondary when space is tight.

### 2. Force stage-specific grids and action rows into a single reading column

Auction, trade, deficit recovery, and trade editor grids all collapse into a single vertical flow on narrow widths.

Why:
- Mobile players scan from top to bottom faster than across paired boxes.
- This protects the “one focus at a time” principle for each stage.

### 3. Make action clusters and asset chips mobile-sized, not desktop leftovers

Buttons and chips will expand to full-width or stacked layouts where appropriate on small screens.

Why:
- High-stakes actions should not feel crammed.
- This reduces accidental taps and keeps consequences readable.

## Risks / Trade-offs

- [Desktop and mobile orders diverge] -> Acceptable because the stage priority problem is specific to narrow screens.
- [Overview feels less prominent on mobile] -> Intentional; the overview becomes supporting context, not the first decision surface.
- [More vertical scrolling] -> Acceptable if the first visible section becomes more actionable and less confusing.

## Migration Plan

1. Add OpenSpec deltas for mobile-first room-stage prioritization.
2. Adjust room-page markup to support mobile stage ordering.
3. Tighten responsive CSS for stage grids, action rows, and asset chips.
4. Add a mobile-viewport Playwright smoke test.
5. Validate with lint and end-to-end coverage.