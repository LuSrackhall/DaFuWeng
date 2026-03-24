## Context

The recent recovery recap is useful, but users still cannot easily tell whether it matches the current authoritative room state.

It also has no automatic expiry rule after the room progresses, and mobile spectator coverage still misses the same pressure phases already covered on desktop.

## Goals / Non-Goals

**Goals:**
- Add a clear freshness anchor to the recent recovery recap.
- Remove stale recaps once authoritative progress moves past their source state.
- Add mobile spectator reconnect regressions for auction, trade response, and jail decision.

**Non-Goals:**
- No reconnect system redesign.
- No persistent recovery history.
- No backend or protocol changes.

## Decisions

### 1. Freshness is anchored to authoritative room progress

Store the recap's authoritative phase label and event sequence when recovery succeeds.

Why:
- The user needs to know which authoritative room moment the recap refers to, not just that a reconnect happened.

### 2. Recap expiry is driven by authoritative progression

Remove the recap once the room's event sequence advances beyond the recap anchor.

Why:
- This is more reliable than pure time-based expiry and better reflects whether the recap is still current.

### 3. Mobile spectator regressions should mirror desktop pressure coverage

Add 375px spectator reconnect regressions for:
- live auction
- trade response
- jail decision

Why:
- These pressure phases are exactly where mobile spectators are most likely to lose context.

## Risks / Trade-offs

- [The recap may disappear quickly in fast-moving rooms] -> Acceptable because it should only survive while it still matches the current authoritative state.
- [More mobile reconnect regressions increase suite time] -> Acceptable because reconnect remains a release-critical recovery path.

## Migration Plan

1. Add OpenSpec artifacts for recovery freshness and mobile spectator coverage.
2. Add phase and sequence anchors to the recent recovery recap.
3. Expire stale recaps when authoritative progress advances.
4. Add mobile spectator pressure-phase reconnect regressions.
5. Verify lint and e2e remain green.