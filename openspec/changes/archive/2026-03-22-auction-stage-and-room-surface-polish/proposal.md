## Why

The multiplayer room now supports real waiting rooms, reconnect-safe sessions, deficit handling, and bankruptcy summaries, but the auction phase still reads like a raw form block instead of a real table moment. Players can technically bid or pass, yet the room page does not clearly communicate who is leading, who is still in, whose turn it is, or why the auction was triggered.

This is the next highest-value slice because auction is the first shared economic contest after a player declines to buy a property. Before expanding into deeper systems, the room page needs to make that contest legible and stage-focused.

## What Changes

- Add a dedicated auction stage summary derived from the existing authoritative room snapshot.
- Restructure the room sidebar into a clearer room overview, a single dominant stage card, and lower-priority support sections.
- Improve auction controls so the acting player can quickly place a valid next bid or pass, while non-acting players see a clear read-only explanation.
- Extend projection tests and browser coverage so auction trigger, progression, and settlement remain readable after live updates and refresh.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `auction-room-state`: The room snapshot-backed auction state is now surfaced as a readable stage with bidder status, price state, and turn ownership.
- `auction-recovery`: Refresh and live updates preserve a readable auction surface for both acting and non-acting viewers.
- `web-game-client`: The room page now gives auction the same stage-oriented treatment as waiting rooms and forced resolutions, reducing raw debug-panel feel.

## Impact

- Affected code: frontend room projection, room page layout, presentation focus, CSS, and frontend tests.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web multiplayer auction readability and room-page surface polish.