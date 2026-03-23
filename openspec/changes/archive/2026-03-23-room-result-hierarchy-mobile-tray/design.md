## Context

The room board and side rail now expose recent authoritative results, but the same result still echoes across multiple UI layers.

At the same time, the mobile decision tray keeps too much desktop-card density, which weakens one-hand clarity during active turns.

## Goals / Non-Goals

**Goals:**
- Make result cards the main full-result explanation surface.
- Let the primary action anchor focus on the next decision and consequence.
- Strengthen first-glance neutral vs success differentiation.
- Improve the mobile primary action tray's hierarchy and action focus.
- Add unsold-auction result coverage at the board and card level.

**Non-Goals:**
- No gameplay rule changes.
- No protocol, backend, or projection schema rewrites.
- No build or chunk-splitting work in this change.

## Decisions

### 1. Keep one full result surface

When a formal result exists, the detailed explanation should live in the result card, while the primary action anchor should pivot back to current responsibility.

Why:
- This reduces repeated copy and keeps the room's information architecture easier to scan.

### 2. Differentiate result tones through multiple channels

Neutral and success results should differ by more than color alone.

Why:
- Players should be able to distinguish "confirmed state" from "completed gain" without reading every sentence.

### 3. Make the mobile tray consequence-first

The mobile tray should preview the outcome of the current decision before showing actions.

Why:
- Mobile players need certainty before tapping, not a stack of equally weighted controls.

### 4. Give unsold auction its own contextual result treatment

An unsold auction should explain that the auction closed without transfer and that ownership remains unsold.

Why:
- This is a neutral formal result, not just a generic system broadcast.

## Risks / Trade-offs

- [Overview cards will carry less raw event detail when a formal result card exists] -> Acceptable because the detailed explanation remains available in a more appropriate surface.
- [Mobile tray becomes more opinionated about action hierarchy] -> Acceptable because the tray exists to simplify immediate decisions, not preserve perfect parity with desktop density.

## Migration Plan

1. Add OpenSpec artifacts for result hierarchy and mobile tray refinement.
2. Refine GamePage result hierarchy and mobile action tray structure.
3. Strengthen neutral/success presentation in BoardScene and App.css.
4. Add Playwright coverage for unsold auction result semantics.
5. Verify lint and e2e remain green.