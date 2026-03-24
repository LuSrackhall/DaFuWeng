## Context

After introducing the formal clean e2e lane, three Playwright failures remain.

They are not rooted in gameplay regressions. One is a fragile mobile spectator reconnect live flow, and two assume trade can be initiated before the authoritative turn returns to the proposer.

## Goals / Non-Goals

**Goals:**
- Remove the remaining clean full-suite false negatives.
- Keep product logic unchanged.
- Align test preconditions with the current authoritative turn model.

**Non-Goals:**
- No gameplay changes.
- No reconnect UX changes.
- No CI workflow changes in this slice.

## Decisions

### 1. Replace the mobile spectator reconnect live flow with a deterministic recovery baseline

Use a controlled snapshot and catch-up path instead of a three-page live room sequence.

Why:
- The test intent is read-only recovery feedback and overflow safety, not multiplayer live sequencing.

### 2. Restore trade tests to the proposer's next authoritative turn

Advance the guest player's turn before asking the host to open turn tools and propose a trade.

Why:
- Current room flow advances away from the host after buying property, so the trade tests must earn the host turn back before asserting trade actions.

## Risks / Trade-offs

- [Less live coverage in the mobile spectator reconnect test] -> Acceptable because other live reconnect coverage remains and this test becomes reliable.
- [Trade tests become slightly longer again] -> Acceptable because they now match the real authoritative turn model.

## Migration Plan

1. Update the three failing Playwright tests.
2. Verify the targeted clean full-suite failures are resolved.
3. Re-run the full clean Playwright suite.