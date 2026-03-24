## Context

Reconnect success feedback already answers whether the room has recovered, but it still does not fully answer where the recovered room now stands for the player.

The current automated suite also misses three reconnect branches that matter for real play: no-summary fallback, property decision reconnect, and deficit recovery reconnect on mobile.

## Goals / Non-Goals

**Goals:**
- Turn reconnect success context into a fuller recovery narrative.
- Cover no-summary fallback recovery.
- Cover mobile player reconnect during property decision and deficit recovery.

**Non-Goals:**
- No backend reconnect changes.
- No new game rules, commands, or permissions.
- No event replay timeline UI.

## Decisions

### 1. Recovery narrative remains snapshot-driven

Build reconnect success narration only from the recovered authoritative snapshot and current derived frontend summaries.

Why:
- This keeps the feature deterministic and avoids depending on fragile event-history assumptions.

### 2. The strip should explain current action context

For ordinary recovery, property decision, and deficit recovery, the strip should say what was just recovered and what the current action state now is.

Why:
- Players need both recovery confirmation and immediate situational clarity.

### 3. Add the three highest-value reconnect branches next

Automate these branches:
- fallback recovery with no latest event summary
- mobile player reconnect during property decision
- mobile player reconnect during deficit recovery

Why:
- Together they cover the most valuable missing narrative and decision-heavy reconnect states.

## Risks / Trade-offs

- [Narrative strings may become longer on mobile] -> Acceptable because they remain short-lived and carry meaningful state context.
- [More reconnect tests can slow the suite slightly] -> Acceptable because reconnect remains a release-critical recovery path.

## Migration Plan

1. Add OpenSpec artifacts for reconnect narrative branches.
2. Upgrade success-strip context generation to cover ordinary, property, and deficit recovery.
3. Add fallback and mobile reconnect Playwright regressions.
4. Verify lint and e2e remain green.