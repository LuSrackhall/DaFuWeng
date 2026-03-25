## Context

Recent work proved that a seated non-acting page in a 4-player room can refresh and recover the same authoritative room state. The next confidence gap is narrower but more critical: the acting player refreshing during their own turn.

This slice focuses on that single proof point in the most stable real-room dice flow.

## Goals / Non-Goals

**Goals:**
- Prove that the acting player in a 4-player real room can refresh and keep the same seat.
- Prove that the refreshed acting player still owns the current action right.
- Prove that the refreshed acting player can continue the turn and advance the authoritative room for everyone.

**Non-Goals:**
- No reconnect fallback UI changes.
- No backend rule changes.
- No auction, trade, deficit, or jail refresh coverage in this slice.

## Decisions

### 1. Use the simplest stable dice-and-rent sequence

The test uses the existing deterministic first-loop path where each player lands on the same owned property. This keeps the recovery proof focused on seat continuity and action rights instead of branching game decisions.

### 2. Refresh the fourth player after they become the acting player

Refreshing the fourth player after the first three turns gives a stable current-turn state while keeping three other live pages online to verify shared room consistency.

### 3. Require post-refresh action completion

The test does not stop at button recovery. It must continue the refreshed action and verify the next turn handoff across all pages.

## Validation Strategy

1. Run the new Playwright test for current-turn refresh recovery.
2. Confirm the refreshed page keeps the same player identity and action button.
3. Confirm the refreshed action advances the same authoritative room for all four pages.