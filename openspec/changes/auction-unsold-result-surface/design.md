## Context

The backend already emits `auction-ended-unsold`, and the frontend clears pending auction state when it receives that event. What is missing is the player-facing explanation after the stage disappears.

Without a visible result, a no-sale ending feels weaker than a winning bid even though it is still a formal room outcome.

## Goals / Non-Goals

**Goals:**
- Make a no-sale auction outcome visible through the existing recent-result surface.
- Explain that ownership did not change and nobody paid.
- Keep the slice frontend-only.

**Non-Goals:**
- No reserve prices, automatic re-auctions, bid timers, or auction rule expansion.
- No protocol changes.

## Decisions

### 1. Reuse latest settlement/result summary infrastructure

The frontend will extend `latestSettlementSummary` to also recognize `auction-ended-unsold`.

Why:
- The room already has a recent-result card for other formal outcomes.
- This is the smallest coherent way to surface the missing result.

### 2. Treat unsold auction as a neutral result, not an error

The summary should read like a completed room outcome rather than a warning or failure panel.

Why:
- A no-sale outcome is still an authoritative resolution.
- Players should understand it as a finished step, not a broken flow.

## Risks / Trade-offs

- [Unsold result could be buried behind newer results] -> Acceptable for this slice because the card already reflects the latest formal room outcome.
- [Summary could over-explain auction internals] -> Keep the message focused on no winner, unchanged ownership, and next step.

## Migration Plan

1. Add OpenSpec deltas for readable unsold-auction result feedback.
2. Extend frontend projection summary logic.
3. Add a projection test for `auction-ended-unsold`.
4. Validate with lint and relevant tests.