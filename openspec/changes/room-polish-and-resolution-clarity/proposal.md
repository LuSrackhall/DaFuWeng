## Why

The multiplayer MVP now enters real authoritative rooms, but the waiting room still reads like a debug panel and the deficit-to-bankruptcy path is harder to understand than it should be. Players can technically recover or go bankrupt, yet the room does not explain the acting seat, the debt source, or the final outcome clearly enough for a premium board-game flow.

This change is needed now because the next most valuable step after the real-room MVP is trust and clarity. Before expanding more rules, the web client needs to make pre-game readiness and forced-payment resolution readable at a glance.

## What Changes

- Reshape the waiting room into a clearer pre-game stage that highlights room identity, player seats, host authority, start conditions, and reconnect expectations.
- Add a dedicated resolution summary surface for deficit and bankruptcy states so players can see who owes whom, why the room is paused, what recovery options remain, and what happens if bankruptcy is declared.
- Improve room-side visual focus so the current waiting-room blocker or resolution subject is highlighted instead of showing only generic state values.
- Extend projection-level tests and end-to-end waiting-room assertions to cover the new clarity layer without changing backend room protocols.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `multiplayer-room-lifecycle`: The waiting room presentation now surfaces clearer seat, host, and start-readiness information before the match begins.
- `web-game-client`: The web room page now provides explicit stage-oriented guidance for waiting rooms and forced-payment resolution instead of exposing mostly raw state fields.
- `deficit-room-state`: The client-facing deficit state now explains debt source, creditor, remaining amount, and available recovery actions.
- `bankruptcy-settlement-loop`: Bankruptcy outcomes are now presented with explicit creditor-aware settlement summaries and room continuation or finish guidance.

## Impact

- Affected code: frontend room projection, room page UI, presentation state, board highlighting, CSS, and Playwright plus Vitest coverage.
- APIs and persistence: no protocol or storage changes are required for this slice.
- Systems: web multiplayer readability, reconnect comprehension, and forced-resolution trust.