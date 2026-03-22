## Why

The trade flow before submission is now much clearer, but once an offer is sent the room still drops into a fairly flat waiting state. The proposer, counterparty, and spectators can all read the same facts, yet they do not get clearly different guidance about who must act, who can only wait, and what the room will do next.

That keeps the protocol working, but the waiting phase still feels more suspended than deliberate.

## What Changes

- Rework the pending trade stage into a clearer waiting experience with role-specific guidance.
- Show different primary messages for the proposer, counterparty, and read-only viewers.
- Move expected outcomes ahead of secondary detail so accept or reject consequences are obvious.
- Extend browser coverage with role-specific assertions for the waiting stage.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The pending trade stage now presents clearer role-specific waiting guidance.

## Impact

- Affected code: frontend pending trade stage, room-page styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: pending trade response stage on the web room page.