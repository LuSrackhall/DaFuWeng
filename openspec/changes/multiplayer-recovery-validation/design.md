## Context

Current automation already proves 3-player and 4-player room startup, plus several snapshot-based reconnect and bankruptcy UI narratives. The remaining gap is not basic room creation, but recovery under real multiplayer pressure.

This slice adds two targeted validations:
- backend integration for 3-player bankruptcy that keeps the room alive
- Playwright validation for 4-player real-room refresh recovery

## Goals / Non-Goals

**Goals:**
- Prove that bankruptcy can resolve in a 3-player room without incorrectly finishing the match.
- Prove that a seated player in a 4-player real room can refresh and recover the same authoritative seat and turn state.
- Keep the slice thin so failures stay easy to attribute.

**Non-Goals:**
- No new gameplay rules.
- No full long-match multiplayer saga.
- No combined bankruptcy-plus-refresh mega test.

## Decisions

### 1. Split rule truth and browser recovery truth

The 3-player bankruptcy continuation is best verified at backend integration level because the core risk is authoritative room-state transition. The 4-player refresh scenario is best verified in Playwright because the core risk is seat recovery and browser projection catch-up.

### 2. Use one active-player refresh in the 4-player E2E

Refreshing the player whose turn is currently active gives stronger evidence than refreshing a passive observer, while avoiding the instability of all-player simultaneous refresh tests.

### 3. Keep OpenSpec focused on recovery validation rather than new product scope

This change is validation-focused. It strengthens confidence in existing multiplayer capabilities instead of expanding gameplay scope.

## Validation Strategy

1. Run the new backend integration test for the 3-player bankruptcy continuation path.
2. Run the targeted Playwright tests for the new 4-player refresh recovery path.
3. Confirm the room continues after bankruptcy when two active players remain.
4. Confirm the refreshed player retains the same seat and action rights in the 4-player room.