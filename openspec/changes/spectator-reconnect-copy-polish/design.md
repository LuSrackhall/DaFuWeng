## Context

The room reconnect path already has a player-focused recovery regression, but spectator recovery remains uncovered.

Separately, high-visibility room and board surfaces still contain a few engineering phrases that reduce product polish.

## Goals / Non-Goals

**Goals:**
- Validate spectator reconnect recovery through catch-up.
- Prove spectator pages remain read-only before and after reconnect recovery.
- Reduce engineering language in room and board surfaces.

**Non-Goals:**
- No backend reconnect logic changes.
- No permission model changes.
- No redesign of room-state structure.

## Decisions

### 1. Spectator reconnect gets its own recovery regression

Use a dedicated Playwright test with a Fake EventSource on the spectator page.

Why:
- Spectator recovery has different failure risks than player recovery, especially around read-only guarantees.

### 2. Recovery must be driven by real room progression

After spectator realtime failure, another player should advance the room so polling catch-up has real work to recover.

Why:
- This proves the spectator did not just hide the reconnect shell; it actually caught up to the latest room state.

### 3. Clean up high-frequency wording next

Room anchor labels, turn-tools labels, board waiting language, and waiting-room reconnect guidance should use more natural game phrasing.

Why:
- These are repeated surfaces, so even small wording changes improve the overall product feel noticeably.

## Risks / Trade-offs

- [More copy churn may force test updates] -> Acceptable because this change intentionally standardizes player-facing language.
- [Spectator reconnect test relies on Fake EventSource] -> Acceptable because it is the most stable way to exercise the frontend reconnect branch.

## Migration Plan

1. Add OpenSpec artifacts for spectator reconnect and copy polish.
2. Update room/board copy on the highest-frequency surfaces.
3. Add a spectator reconnect recovery Playwright regression.
4. Verify lint and e2e remain green.