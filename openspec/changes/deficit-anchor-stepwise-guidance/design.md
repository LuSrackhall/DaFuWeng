## Context

The room already exposes a best next mortgage action during deficit recovery.

The remaining gap is player confidence during multi-step deficits: after one mortgage, the anchor should continue to act like a live guide rather than a one-off recommendation.

## Goals / Non-Goals

**Goals:**
- Make the deficit anchor clearly express that recovery can be a continuing path.
- Show the next recommended action and the remaining shortfall after the next step.
- Validate a two-step deficit recovery flow through Playwright.

**Non-Goals:**
- No new room states, protocol fields, or recovery commands.
- No backend or rule changes.
- No local wizard state that can drift from the authoritative snapshot.

## Decisions

### 1. Derive all stepwise guidance from the authoritative snapshot

The anchor should derive its step wording entirely from current shortfall and available mortgage options.

Why:
- This keeps refresh recovery and spectator views aligned without introducing fake client-only steps.

### 2. Describe the next action, not an abstract step counter

The anchor should say what to do next and what shortfall will remain, instead of inventing numbered steps.

Why:
- The path can change after each authoritative update, so next-action guidance is more truthful than a client-maintained wizard step.

### 3. Lock the complex path with a multi-mortgage E2E flow

The most valuable validation is a deficit that requires more than one mortgage before the room exits recovery.

Why:
- This proves the anchor continues to guide from new snapshots rather than only helping on the first click.

## Risks / Trade-offs

- [The anchor remains recommendation-driven, not a full recovery wizard] -> Acceptable because the goal is better continuity, not a new state machine.
- [The guidance still depends on the existing recovery asset ranking heuristic] -> Acceptable because this change clarifies that heuristic instead of replacing it.

## Migration Plan

1. Add OpenSpec artifacts for stepwise deficit guidance.
2. Update deficit anchor copy and action labels in GamePage.
3. Add a multi-step deficit recovery Playwright scenario.
4. Verify lint and room-flow E2E remain green.