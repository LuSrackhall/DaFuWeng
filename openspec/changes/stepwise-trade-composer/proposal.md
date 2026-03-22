## Why

The turn-tools shelf reduced visual pressure, but the trade draft still opens as a dense form. Players must parse target selection, cash fields, asset pools, and summary previews all at once before they feel confident enough to send an offer.

That makes trade drafting visible, but still harder to use than it needs to be.

## What Changes

- Replace the single trade draft form with a stepwise composer inside the turn-tools shelf.
- Split the flow into selecting a counterparty, choosing what you offer, choosing what you request, and confirming the final summary.
- Keep a live bilateral summary visible across the steps so players always understand the current draft.
- Extend browser coverage with a scenario that validates the stepwise flow before a trade enters the existing pending-response stage.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The normal-turn trade drafting surface now uses a stepwise composer instead of a single dense form.

## Impact

- Affected code: frontend trade drafting surface, room-page styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: normal-turn optional trade drafting on the web room page.