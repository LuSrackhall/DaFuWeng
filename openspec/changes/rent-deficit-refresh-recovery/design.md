## Context

Current repository capabilities already cover these pieces independently:

- owned-tile rent and improved rent resolution
- authoritative deficit room state
- mortgage-based recovery
- bankruptcy exits
- refresh-safe room projection recovery

The next slice should not invent a new economic system. It should compose those existing capabilities into a single authoritative loop for player-creditor rent debt inside a 4-player refresh-safe room.

## Goals / Non-Goals

**Goals:**
- Pause the room when a player cannot afford rent owed to another player.
- Preserve the player creditor, total debt, acting player, and remaining recovery context across refresh and reconnect.
- Let the debtor continue through existing recovery exits: mortgage or bankruptcy.
- Restore the room to a coherent post-recovery state for all connected players.
- Define a validation plan that relies on unit and integration coverage first, with one real-room refresh proof at the top.

**Non-Goals:**
- No tax deficit or card deficit expansion in this slice.
- No new recovery actions such as selling houses or negotiated debt restructuring.
- No broad UI redesign for deficit surfaces.
- No full implementation in this planning round.

## Decisions

### 1. Reuse the existing deficit stage

Rent debt recovery remains inside the existing authoritative deficit stage instead of creating a rent-specific room phase. The slice only constrains the payload and behavior when the creditor is another player.

### 2. Keep the recovery exits minimal

The debtor may continue through the existing mortgage and bankruptcy actions only. This keeps the slice small, reduces state branching, and makes refresh recovery easier to prove.

### 3. Treat refresh recovery as a snapshot-first problem

The system must restore rent deficit context from the authoritative room snapshot instead of relying on the frontend to reconstruct debt details from event narration alone.

### 4. Validate from fast layers upward

This slice should not be justified by Playwright alone. Deterministic rules and state transitions belong in unit and integration coverage first, with one 4-player refresh scenario as the final integration proof.

## Minimal Validation Plan

### Unit tests

- Verify rent calculation and unaffordable rent entry into deficit.
- Verify that the creditor stays a player creditor for rent debt.
- Verify mortgage recovery state transitions: still deficient vs fully settled.
- Verify bankruptcy exits when rent debt cannot be resolved.

### Integration tests

- Verify authoritative room state enters rent deficit without advancing normal turn flow.
- Verify refreshed room snapshots keep the same debtor, creditor, amount, and acting permissions.
- Verify non-debtor recovery commands are rejected.
- Verify mortgage and bankruptcy exits settle or terminate the debt exactly once.

### Playwright

- Add one 4-player real-room refresh scenario where a debtor refreshes during rent deficit recovery and continues the same authoritative debt chain.
- Add one observer or non-acting refresh assertion showing the room remains read-only for everyone except the debtor.

## Risks

- If this slice expands to tax, card, and rent deficit together, the change will stop being minimally shippable.
- If snapshot payloads are incomplete, refresh-safe E2E will become flaky or misleading.
- If validation relies on Playwright alone, slow feedback loops will hide deterministic rule regressions and make refactors harder.