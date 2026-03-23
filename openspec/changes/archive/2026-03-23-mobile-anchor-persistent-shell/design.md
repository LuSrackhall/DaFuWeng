## Context

The room page already has a strong primary action anchor, but the mobile breakpoint currently removes its sticky behavior.

That makes the most important room action easy to lose during board reading and long room-state flows.

## Goals / Non-Goals

**Goals:**
- Keep the primary action anchor visible on narrow screens.
- Prevent the mobile anchor tray from covering the last interactive content.
- Verify the anchor remains visible and actionable after scrolling.

**Non-Goals:**
- No new mobile-only state machine or dual-anchor system.
- No changes to room permissions, game rules, or turn authority.
- No full bottom-sheet redesign for all room detail content.

## Decisions

### 1. Use a floating bottom tray on mobile

The mobile breakpoint should promote the primary action anchor to a fixed bottom tray.

Why:
- This gives the smallest implementation that still guarantees the next decision remains visible.

### 2. Add container leave-behind space instead of restructuring layout

The room shell and room rail should reserve bottom space so fixed mobile anchor height does not cover content.

Why:
- This keeps the implementation CSS-only and avoids touching room rendering logic.

### 3. Validate visibility after scrolling

Mobile Playwright coverage should confirm the anchor remains visible and its CTA remains trial-clickable after scrolling.

Why:
- Presence alone is not enough; the persistent anchor must remain usable.

## Risks / Trade-offs

- [The fixed tray still uses the full existing anchor content] -> Acceptable for this cut because the priority is persistent access, not a full compact mobile redesign.
- [Reserved bottom spacing is a heuristic rather than measured height] -> Acceptable because the tray height is also capped on mobile.

## Migration Plan

1. Add OpenSpec artifacts for the mobile persistent anchor tray.
2. Update mobile CSS for the fixed bottom tray and container spacing.
3. Add mobile Playwright assertions for visibility and clickability after scroll.
4. Verify lint and E2E remain green.