## Context

The room page already elevates pending trade into the dominant stage surface, but its content remains close to a generic summary card. Players can read the offer, yet the stage does not strongly separate the perspective of the waiting proposer from the deciding counterparty.

This slice makes the waiting phase more readable and more role-specific without changing the authoritative trade flow.

## Goals / Non-Goals

**Goals:**
- Differentiate proposer, counterparty, and read-only waiting states.
- Explain what happens if the trade is accepted or rejected before the buttons.
- Keep the bilateral exchange summary visible.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No timers, reminders, or asynchronous notifications.
- No change to trade resolution logic.

## Decisions

### 1. Pending trade keeps one dominant stage, but changes its voice by viewer role

The room page still uses one dominant trade stage, but it changes the leading copy and action framing based on the current viewer.

Why:
- The room should still feel shared and authoritative.
- The main problem is not a missing stage, but unclear perspective within that stage.

### 2. Outcome preview appears before the action buttons

The stage explains what acceptance or rejection will do before the counterparty chooses.

Why:
- Decision context should arrive before the buttons.
- This reduces hesitation and accidental responses.

### 3. Read-only viewers explicitly see that they cannot act

Non-responders get a clear read-only explanation instead of silently disabled controls.

Why:
- This prevents confusion in multiplayer rooms.
- It aligns with the rest of the room-page authority model.

## Risks / Trade-offs

- [More role-specific copy on one stage] -> Acceptable because the stage remains structurally simple.
- [The proposer still cannot influence the room while waiting] -> Intended; the goal is clarity, not new control.
- [Spectator guidance may duplicate some existing labels] -> Acceptable because explicit read-only framing is more important than compactness here.

## Migration Plan

1. Add OpenSpec deltas for the stronger waiting experience.
2. Rework the pending trade stage into role-specific waiting guidance.
3. Keep trade acceptance and rejection protocol unchanged.
4. Extend browser coverage with proposer, counterparty, and read-only assertions.
5. Validate with lint and end-to-end coverage.
