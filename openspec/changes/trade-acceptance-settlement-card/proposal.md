## Why

The trade flow is now strong before submission and while waiting on a response, but once a trade is accepted the room still falls back to a generic recent-result card. Players can infer that the deal happened, yet they do not get a strong bilateral settlement confirmation that explains who exchanged what and where the cash landed.

That leaves the final trade moment readable, but not yet satisfying or decisive enough for a multiplayer board game.

## What Changes

- Turn accepted trade results into a dedicated bilateral settlement card.
- Show each side's give/get outcome and post-trade cash landing points.
- Keep the room's next-step guidance visible under the settlement result.
- Extend projection and browser coverage for the richer accepted-trade result.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Accepted trades now render as a dedicated settlement card instead of only a generic recent-result summary.

## Impact

- Affected code: frontend projection shaping, accepted-trade settlement rendering, room-page styles, and frontend tests.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: accepted trade result rendering on the web room page.