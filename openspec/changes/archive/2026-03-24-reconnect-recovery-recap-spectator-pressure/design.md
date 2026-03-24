## Context

The reconnect success strip now lands well, but it still vanishes completely after a few seconds. Users who glance away can lose the recovered context again.

Spectators also remain under-covered in the exact phases where context matters most: auctions, trade responses, and jail decisions.

## Goals / Non-Goals

**Goals:**
- Preserve a lightweight recent recovery recap after the reconnect strip dismisses.
- Add spectator reconnect regressions for auction, trade response, and jail decision.
- Keep the recap subordinate to the transient reconnect success strip.

**Non-Goals:**
- No reconnect system redesign.
- No backend changes.
- No full event history or replay UI.

## Decisions

### 1. Recent recovery recap stays in the room overview rail

Place the recap in the overview card after the transient reconnect success strip disappears.

Why:
- It remains easy to re-scan without competing with the board or top-level action surfaces.

### 2. The recap remains lightweight and session-local

Store the last recovery recap as a local presentation snapshot in GamePage, using the same reconnect narrative that powered the transient strip.

Why:
- This keeps the recap tied to the latest recovery event without turning it into a new protocol or projection responsibility.

### 3. Spectator reconnect coverage should mirror pressure phases

Add spectator reconnect regressions for:
- live auction
- trade response
- jail decision

Why:
- Spectators need clear recovery context in the same high-pressure phases as players, but with strict read-only guarantees.

## Risks / Trade-offs

- [The overview card gets slightly denser] -> Acceptable because the recap is lightweight and only appears after an actual recovery event.
- [Recovery text may repeat between the strip and the recap] -> Acceptable because they do not display at the same time.

## Migration Plan

1. Add OpenSpec artifacts for recovery recap and spectator pressure coverage.
2. Persist the most recent reconnect recovery recap in GamePage.
3. Render the recap inside the overview card after the transient strip dismisses.
4. Add spectator pressure reconnect regressions and recap assertions.
5. Verify lint and e2e remain green.